import crypto from 'crypto';

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
        const { orderId, paymentId, signature, email, packageName, amount } = req.body;

        console.log('📦 Full request body:', { orderId, paymentId, email, packageName, amount });

        const secret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!secret) {
            console.error('❌ RAZORPAY_KEY_SECRET not configured');
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
            console.log('✅ Payment verified for:', email);

            const token = generateToken(email, packageName);
            console.log('🔑 Token generated:', token);

            // ১. Google Sheets-এ সেভ
            await saveUserToGoogleSheets(email, packageName, token, paymentId, amount);

            // ২. অটো ইমেইল পাঠান (EmailJS)
            await sendEmailJS(email, token, packageName);

            res.status(200).json({
                success: true,
                paymentId: paymentId,
                token: token,
                message: 'Payment verified! Email sent.'
            });
        } else {
            console.error('❌ Invalid signature');
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

// ===== EmailJS দিয়ে অটো ইমেইল =====
async function sendEmailJS(email, token, packageName) {
    try {
        const baseUrl = process.env.BASE_URL || 'https://physics-premium.vercel.app';
        const accessLink = `${baseUrl}/posts/2026/08/magnetic-effects.html?token=${token}`;
        const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');

        console.log('📧 Sending email to:', email);
        console.log('🔗 Access link:', accessLink);

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: 'service_27gemli',
                template_id: 'template_ycce885',
                user_id: 'hViHPsxs_BAdnj5_O',
                template_params: {
                    to_email: email,
                    access_link: accessLink,
                    expiry_date: expiryDate,
                    package_name: packageName || 'Premium Notes'
                }
            })
        });

        const result = await response.json();
        console.log('✅ EmailJS Response:', result);
    } catch (error) {
        console.error('❌ EmailJS error:', error.message);
    }
}