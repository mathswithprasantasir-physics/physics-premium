// api/create-order.js
import Razorpay from 'razorpay';

export default async function handler(req, res) {
    // CORS headers
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

        console.log('📦 Creating order for:', { amount, email, packageName });

        // ✅ Environment Variables চেক করুন
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        console.log('🔑 RAZORPAY_KEY_ID:', keyId ? '✅ Set' : '❌ Missing');
        console.log('🔑 RAZORPAY_KEY_SECRET:', keySecret ? '✅ Set' : '❌ Missing');

        if (!keyId || !keySecret) {
            console.error('❌ Razorpay keys are missing');
            return res.status(500).json({ 
                error: 'Razorpay configuration error',
                details: 'API keys not configured'
            });
        }

        // Razorpay ইনস্ট্যান্স তৈরি
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // অর্ডার তৈরি
        const options = {
            amount: amount * 100, // রুপি থেকে পয়সা (INR)
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: {
                email: email || 'unknown',
                package: packageName || 'Premium Notes'
            }
        };

        console.log('📤 Razorpay order options:', options);

        const order = await razorpay.orders.create(options);
        
        console.log('✅ Order created successfully:', order.id);

        res.status(200).json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: keyId // ক্লায়েন্ট সাইডে দরকার
        });

    } catch (error) {
        console.error('❌ Order creation error:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        
        res.status(500).json({ 
            error: 'Order creation failed',
            details: error.message,
            razorpayError: error.response?.data
        });
    }
}