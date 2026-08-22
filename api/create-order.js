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

        console.log('📦 Creating order for:', { amount, email, packageName });

        // ✅ Environment Variables চেক
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        console.log('🔑 RAZORPAY_KEY_ID:', keyId ? '✅ Set' : '❌ Missing');
        console.log('🔑 RAZORPAY_KEY_SECRET:', keySecret ? '✅ Set' : '❌ Missing');

        if (!keyId || !keySecret) {
            return res.status(500).json({ 
                error: 'Razorpay configuration error',
                details: 'API keys not configured'
            });
        }

        // Razorpay ইনস্ট্যান্স
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // ✅ UTF-8 স্যানিটাইজেশন
        const sanitizedEmail = email ? email.trim().substring(0, 50) : 'unknown';
        const sanitizedPackage = packageName ? packageName.trim().substring(0, 30) : 'Premium Notes';
        
        // ✅ শুধু অক্ষর এবং সংখ্যা রাখুন (স্পেশাল ক্যারেক্টার বাদ দিন)
        const cleanEmail = sanitizedEmail.replace(/[^a-zA-Z0-9@._-]/g, '');
        const cleanPackage = sanitizedPackage.replace(/[^a-zA-Z0-9\s-]/g, '');

        // অর্ডার অপশন
        const options = {
            amount: amount * 100, // রুপি থেকে পয়সা
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: {
                email: cleanEmail || 'unknown',
                package: cleanPackage || 'Premium Notes'
            }
        };

        console.log('📤 Razorpay order options:', options);

        const order = await razorpay.orders.create(options);
        
        console.log('✅ Order created successfully:', order.id);

        res.status(200).json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        console.error('❌ Order creation error:', error);
        console.error('📝 Error details:', error.response?.data || error.message);
        
        res.status(500).json({ 
            error: 'Order creation failed',
            message: error.message,
            razorpayError: error.response?.data?.error?.description || 'Unknown error'
        });
    }
}