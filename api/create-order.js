const Razorpay = require('razorpay');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, email, packageName } = req.body;

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TRwBKozxmXvzoY',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'MfoK2F77SfI66pZ1qZNprxG4',
    });

    try {
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                email: email,
                package: packageName || 'Unknown'
            }
        });

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