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
            
            const token = generateToken(email, packageName);
            
            // ===== সরাসরি Google Sheets-এ সেভ করুন =====
            const sheetUrl = process.env.GOOGLE_SHEETS_WEBHOOK;
            
            if (sheetUrl) {
                await fetch(sheetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        package: packageName || 'Unknown',
                        token: token,
                        paymentId: paymentId,
                        amount: amount || 0,
                        createdAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                    })
                });
                console.log('✅ User saved to Google Sheets:', email);
            } else {
                console.warn('⚠️ GOOGLE_SHEETS_WEBHOOK not set');
            }
            
            res.status(200).json({
                success: true,
                paymentId: paymentId,
                token: token,
                message: 'Payment verified!'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }
    } catch (error) {
        console.error('❌ Verification error:', error);
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