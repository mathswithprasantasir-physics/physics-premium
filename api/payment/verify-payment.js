import crypto from 'crypto';
import { db } from '../../lib/db.js';
import { generateToken } from '../../lib/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.join(__dirname, '..', '..', 'data', 'posts');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, paymentId, signature, postId } = req.body;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && signature) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      if (generatedSignature !== signature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    // Update payment log
    const paymentLog = db.paymentLogs.findFirst({ orderId });
    if (!paymentLog) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    db.paymentLogs.update(
      { id: paymentLog.id },
      {
        paymentId: paymentId || `pay_${Date.now()}`,
        status: 'completed',
        completedAt: new Date().toISOString(),
      }
    );

    // Find post
    let postData = null;
    if (fs.existsSync(POSTS_DIR)) {
      const classes = fs.readdirSync(POSTS_DIR);
      for (const cls of classes) {
        const classPath = path.join(POSTS_DIR, cls);
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
    }

    if (!postData) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Create purchase record
    const purchase = db.purchases.create({
      userId: paymentLog.userId,
      postId: postId,
      postTitle: postData.title,
      postClass: postData.class || '',
      postSubject: postData.subject || '',
      amount: postData.price || 49,
      paymentId: paymentId || `pay_${Date.now()}`,
    });

    // Create access token (7 days expiry)
    const accessToken = db.accessTokens.create({
  userId: paymentLog.userId,
  token: `prem_${uuidv4().substring(0, 20)}`,  // ✅ Unique token
  postId: postId,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
});

    // Log download
    db.downloads.create({
      userId: paymentLog.userId,
      postId: postId,
      postTitle: postData.title,
    });

    res.status(200).json({
      success: true,
      token: accessToken.token,
      purchase: purchase,
      downloadUrl: `/api/download?token=${accessToken.token}`,
      message: 'Payment verified successfully!',
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
}