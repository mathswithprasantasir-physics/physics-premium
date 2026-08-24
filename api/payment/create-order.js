import { getUserFromRequest } from '../../lib/auth.js';
import { db } from '../../lib/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.join(__dirname, '..', '..', 'data', 'posts');

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

    // Find post data
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

    // Create Razorpay order (or mock)
    let order = null;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        order = await razorpay.orders.create({
          amount: postData.price * 100,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          payment_capture: 1,
          notes: { userId: user.userId, postId: postId },
        });
      } catch (e) {
        console.warn('Razorpay order creation fallback:', e.message);
      }
    }

    if (!order) {
      order = {
        id: `order_demo_${Date.now()}`,
        amount: postData.price * 100,
        currency: 'INR',
      };
    }

    // Log payment
    db.paymentLogs.create({
      orderId: order.id,
      userId: user.userId,
      amount: postData.price,
      status: 'pending',
    });

    res.status(200).json({
  id: order.id,
  amount: order.amount,
  currency: order.currency || 'INR',
  postId: postId,
  postTitle: postData.title,
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSNkvfOF1qshGC', // ✅ Added
});

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}