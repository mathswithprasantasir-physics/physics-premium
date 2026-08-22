// api/test-razorpay.js
import Razorpay from 'razorpay';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        // কনফিগারেশন চেক
        const config = {
            keyId: keyId ? '✅ Present' : '❌ Missing',
            keySecret: keySecret ? '✅ Present' : '❌ Missing',
            keyIdValue: keyId,
            keySecretValue: keySecret ? '***' + keySecret.slice(-4) : null
        };

        if (!keyId || !keySecret) {
            return res.status(500).json({
                success: false,
                message: 'Razorpay keys not configured',
                config: config
            });
        }

        // টেস্ট অর্ডার তৈরি
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const order = await razorpay.orders.create({
            amount: 100, // ₹1
            currency: 'INR',
            receipt: 'test_receipt_' + Date.now(),
            payment_capture: 1
        });

        res.status(200).json({
            success: true,
            message: '✅ Razorpay is working!',
            order: order,
            config: config
        });

    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}