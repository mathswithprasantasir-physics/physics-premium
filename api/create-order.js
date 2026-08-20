const Razorpay = require('razorpay');

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

        // Environment Variables চেক
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error('Missing Razorpay Keys:', { keyId: !!keyId, keySecret: !!keySecret });
            return res.status(500).json({ 
                error: 'Razorpay keys not configured',
                details: 'Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET'
            });
        }

        console.log('Creating order for:', { amount, email, packageName });

        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                email: email,
                package: packageName || 'Unknown'
            }
        });

        console.log('Order created:', order.id);

        res.status(200).json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack || 'No stack trace'
        });
    }
}