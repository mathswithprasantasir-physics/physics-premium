import crypto from 'crypto';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS method handle (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // শুধু POST মেথড অনুমোদিত
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // ১. রিকোয়েস্ট থেকে ডেটা নিন
        const { orderId, paymentId, signature, email, packageName, amount } = req.body;

        console.log('🔐 Verifying payment:', { orderId, paymentId, email });

        // ২. Razorpay Secret চেক
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            console.error('❌ RAZORPAY_KEY_SECRET not configured');
            return res.status(500).json({
                success: false,
                message: 'Razorpay secret not configured'
            });
        }

        // ৩. সিগনেচার ভেরিফাই
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        // ৪. সিগনেচার মিলিয়ে দেখুন
        if (generatedSignature !== signature) {
            console.error('❌ Invalid signature');
            return res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        // =============================================
        // ✅ পেমেন্ট সফল — এখন ডেটা সেভ করুন
        // =============================================
        console.log('✅ Payment verified successfully for:', email);

        // ৫. টোকেন জেনারেট করুন
        const token = generateToken(email, packageName);
        console.log('🔑 Token generated:', token);

        // ৬. Google Sheets-এ ডেটা সেভ করুন
        await saveUserToGoogleSheets(email, packageName, token, paymentId, amount);

        // ৭. সফল রেসপন্স
        res.status(200).json({
            success: true,
            paymentId: paymentId,
            token: token,
            message: 'Payment verified and user saved!'
        });

    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}

// =============================================
// টোকেন জেনারেট ফাংশন
// =============================================
function generateToken(email, packageName) {
    const encodedEmail = btoa(email);
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return 'prem_' + timestamp + '_' + encodedEmail + '_' + random;
}

// =============================================
// Google Sheets-এ ডেটা সেভ ফাংশন
// =============================================
async function saveUserToGoogleSheets(email, packageName, token, paymentId, amount) {
    try {
        // Environment Variable থেকে Webhook URL নিন
        const SHEET_URL = process.env.GOOGLE_SHEETS_WEBHOOK;

        if (!SHEET_URL) {
            console.warn('⚠️ GOOGLE_SHEETS_WEBHOOK not configured. Data not saved.');
            return;
        }

        console.log('📤 Sending to Google Sheets:', SHEET_URL);

        // ইউজার ডেটা তৈরি
        const userData = {
            email: email,
            package: packageName || 'Unknown',
            token: token,
            paymentId: paymentId || 'N/A',
            amount: amount || 0,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        console.log('📦 User data:', userData);

        // Google Sheets-এ ডেটা পাঠান
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ User saved to Google Sheets:', email);
        } else {
            console.error('❌ Google Sheets error:', result.error || 'Unknown error');
        }

    } catch (error) {
        console.error('❌ Database save error:', error.message);
        // Error লগ করলেও API fail করবেন না
    }
}