// api/create-order.js
import Razorpay from 'razorpay';

export default async function handler(req, res) {
    // ... (CORS headers and method checks) ...

    try {
        const { amount, email, packageName } = req.body;

        // --- The Fix: Clean the packageName ---
        // Remove all emojis and special characters, keep only letters, numbers, spaces, and hyphens.
        const cleanPackageName = packageName
            ? packageName.replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 30)
            : 'Premium Notes';
        // --------------------------------------

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: {
                email: email || 'unknown',
                package: cleanPackageName, // Use the cleaned name here
            },
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);

    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({
            error: 'Order creation failed',
            details: error.message,
        });
    }
}