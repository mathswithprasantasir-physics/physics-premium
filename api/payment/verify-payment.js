// api/payment/verify-payment.js
import crypto from 'crypto';
import { prisma } from '../../lib/db.js';
import { generateToken } from '../../lib/auth.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, paymentId, signature, postId } = req.body;

    // Signature verify
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // পেমেন্ট লগ আপডেট
    const paymentLog = await prisma.paymentLog.findFirst({
      where: { orderId: orderId }
    });

    if (!paymentLog) {
      return res.status(404).json({ error: 'Payment log not found' });
    }

    await prisma.paymentLog.update({
      where: { id: paymentLog.id },
      data: {
        paymentId: paymentId,
        status: 'completed',
        completedAt: new Date()
      }
    });

    // পোস্ট ডেটা খুঁজুন
    const postsDir = path.join(process.cwd(), 'data', 'posts');
    let postData = null;

    const classes = fs.readdirSync(postsDir);
    for (const cls of classes) {
      const classPath = path.join(postsDir, cls);
      if (!fs.statSync(classPath).isDirectory()) continue;

      const subjects = fs.readdirSync(classPath);
      for (const sub of subjects) {
        const subjectPath = path.join(classPath, sub);
        if (!fs.statSync(subjectPath).isDirectory()) continue;

        const filePath = path.join(subjectPath, `${postId}.json`);
        if (fs.existsSync(filePath)) {
          postData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          break;
        }
      }
      if (postData) break;
    }

    if (!postData) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // পারচেজ সেভ
    const purchase = await prisma.purchase.create({
      data: {
        userId: paymentLog.userId,
        postId: postId,
        postTitle: postData.title,
        postClass: postData.class || '',
        postSubject: postData.subject || '',
        amount: postData.price,
        paymentId: paymentId
      }
    });

    // অ্যাক্সেস টোকেন তৈরি
    const token = generateToken({ id: paymentLog.userId, email: 'user' });
    const accessToken = await prisma.accessToken.create({
      data: {
        userId: paymentLog.userId,
        token: `prem_${Date.now()}_${token.substring(0, 20)}`,
        postId: postId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.status(200).json({
      success: true,
      token: accessToken.token,
      purchase: purchase,
      message: 'Payment verified successfully!'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
}