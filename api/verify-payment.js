import crypto from 'crypto';

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
        const { orderId, paymentId, signature, email, packageName, amount } = req.body;

        const secret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!secret) {
            return res.status(500).json({ 
                success: false, 
                message: 'Razorpay secret not configured' 
            });
        }

        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        if (generatedSignature === signature) {
            // ✅ পেমেন্ট ভেরিফাই হয়েছে
            
            // ১. টোকেন জেনারেট
            const token = generateToken(email, packageName);
            
            // ২. ডেটাবেসে সেভ (localStorage-এর জন্য API কল)
            await saveUserToDatabase(email, packageName, token, paymentId, amount);
            
            res.status(200).json({
                success: true,
                paymentId: paymentId,
                token: token,
                message: 'Payment verified! Access link generated.'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}

function generateToken(email, packageName) {
    const encodedEmail = btoa(email);
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return 'prem_' + timestamp + '_' + encodedEmail + '_' + random;
}

async function saveUserToDatabase(email, packageName, token, paymentId, amount) {
    try {
        // Vercel-এ ডেটা সেভ করার জন্য API কল
        await fetch(process.env.BASE_URL + '/api/save-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email, package: packageName, token, paymentId, amount,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            })
        });
        console.log('✅ User saved:', email);
    } catch (error) {
        console.error('Database save error:', error);
    }
}