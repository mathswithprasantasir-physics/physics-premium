// api/create-order.js
import Razorpay from 'razorpay';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, email, packageName } = req.body;

        console.log('📦 Creating order:', { amount, email, packageName });

        // ✅ Environment Variables চেক
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        console.log('🔑 RAZORPAY_KEY_ID:', keyId ? '✅ Present' : '❌ Missing');
        console.log('🔑 RAZORPAY_KEY_SECRET:', keySecret ? '✅ Present' : '❌ Missing');

        // ❌ যদি Key না থাকে
        if (!keyId || !keySecret) {
            return res.status(500).json({ 
                error: 'Razorpay keys not configured',
                details: 'Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Environment Variables'
            });
        }

        // Razorpay ইনস্ট্যান্স
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // অর্ডার তৈরি
        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: {
                email: email || 'unknown',
                package: packageName || 'Premium Notes'
            }
        };

        const order = await razorpay.orders.create(options);
        
        console.log('✅ Order created:', order.id);

        res.status(200).json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        console.error('❌ Order error:', error);
        console.error('📝 Error details:', error.response?.data || error.message);
        
        // ✅ ক্লায়েন্টকে বিস্তারিত এরর দেখান
        res.status(500).json({ 
            error: 'Order creation failed',
            message: error.message,
            razorpayError: error.response?.data?.error?.description || 'Unknown error'
        });
    }
}