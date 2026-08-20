const crypto = require('crypto');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { orderId, paymentId, signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'MfoK2F77SfI66pZ1qZNprxG4';
    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

    if (generatedSignature === signature) {
        res.status(200).json({
            success: true,
            paymentId: paymentId,
            message: 'Payment verified successfully'
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Invalid signature'
        });
    }
}