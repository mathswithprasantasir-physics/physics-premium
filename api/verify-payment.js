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
        // ===== সমস্ত বডি ডেটা লগ করুন =====
        console.log('📦 Full request body:', req.body);

        const { orderId, paymentId, signature, email, packageName, amount } = req.body;

        // ===== email চেক করুন =====
        console.log('📧 Email received in verify:', email);
        console.log('📧 Type of email:', typeof email);

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
            // ✅ পেমেন্ট ভেরিফাই
            
            // email যদি undefined হয়, তাহলে ডিফল্ট সেট করুন
            const userEmail = email || req.body.email || 'unknown@email.com';
            const userPackage = packageName || req.body.packageName || 'Unknown';
            const userAmount = amount || req.body.amount || 0;

            const token = generateToken(userEmail, userPackage);
            
            console.log('✅ Payment verified for:', userEmail);
            console.log('🔑 Token:', token);

            // Google Sheets-এ সেভ
            await saveUserToGoogleSheets(userEmail, userPackage, token, paymentId, userAmount);

            res.status(200).json({
                success: true,
                paymentId: paymentId,
                token: token,
                email: userEmail,
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

// ===== টোকেন জেনারেট =====
function generateToken(email, packageName) {
    const encodedEmail = btoa(email);
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return 'prem_' + timestamp + '_' + encodedEmail + '_' + random;
}

// ===== Google Sheets-এ সেভ =====
async function saveUserToGoogleSheets(email, packageName, token, paymentId, amount) {
    try {
        const SHEET_URL = process.env.GOOGLE_SHEETS_WEBHOOK;

        if (!SHEET_URL) {
            console.warn('⚠️ GOOGLE_SHEETS_WEBHOOK not configured');
            return;
        }

        console.log('📤 Sending to Google Sheets:', SHEET_URL);

        const userData = {
            email: email,
            package: packageName || 'Unknown',
            token: token,
            paymentId: paymentId || 'N/A',
            amount: amount || 0,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await fetch(SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ User saved to Google Sheets:', email);
        } else {
            console.error('❌ Google Sheets error:', result);
        }
    } catch (error) {
        console.error('❌ Database save error:', error.message);
    }
}