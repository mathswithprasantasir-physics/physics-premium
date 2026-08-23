// api/payment/create-order.js
import Razorpay from 'razorpay';
import { getUserFromRequest } from '../../lib/auth.js';
import { prisma } from '../../lib/db.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const { postId } = req.body;

    // পোস্ট খুঁজুন
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

    // Razorpay অর্ডার
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: postData.price * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        userId: user.userId,
        postId: postId
      }
    });

    // পেমেন্ট লগ
    await prisma.paymentLog.create({
      data: {
        orderId: order.id,
        userId: user.userId,
        amount: postData.price,
        status: 'pending'
      }
    });

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      postId: postId,
      postTitle: postData.title
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}