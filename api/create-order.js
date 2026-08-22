// api/create-order.js
import Razorpay from 'razorpay';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, email, packageName } = req.body;

        // Razorpay ইনস্ট্যান্স তৈরি
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // অর্ডার তৈরি
        const options = {
            amount: amount * 100, // রুপি থেকে পয়সা
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: {
                email: email,
                package: packageName || 'Premium Notes'
            }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: error.message });
    }
}