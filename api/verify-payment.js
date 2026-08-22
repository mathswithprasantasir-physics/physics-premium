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

        console.log('📦 Payment verification request:', { orderId, paymentId, email, packageName, amount });

        if (!email) {
            console.error('❌ Email is missing');
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!secret) {
            console.error('❌ RAZORPAY_KEY_SECRET not configured');
            return res.status(500).json({ success: false, message: 'Razorpay secret not configured' });
        }

        // Signature verify
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        if (generatedSignature === signature) {
            console.log('✅ Payment verified for:', email);

            // ✅ সঠিক টোকেন জেনারেট
            const token = generateSecureToken(email);
            console.log('🔑 Token generated:', token);

            // Google Sheets-এ সেভ
            await saveUserToGoogleSheets(email, packageName, token, paymentId, amount);

            // ইমেইল পাঠান
            await sendEmailWithToken(email, token, packageName);

            res.status(200).json({
                success: true,
                paymentId: paymentId,
                token: token,
                message: 'Payment verified! Email sent.'
            });
        } else {
            console.error('❌ Invalid signature');
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ===== সঠিক টোকেন জেনারেট =====
function generateSecureToken(email) {
    // Email কে base64url এ encode করুন (URL-safe)
    const encodedEmail = Buffer.from(email).toString('base64');
    
    // base64 থেকে URL-safe characters এ কনভার্ট
    const safeEmail = encodedEmail
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    
    // র্যান্ডম স্ট্রিং
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    
    // টোকেন তৈরি: prem_<timestamp>_<email>_<random>
    return `prem_${timestamp}_${safeEmail}_${random}`;
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

        console.log('📤 Saving to Google Sheets:', userData);

        const response = await fetch(SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            console.log('✅ Saved to Google Sheets');
        } else {
            console.error('❌ Google Sheets error:', await response.text());
        }
    } catch (error) {
        console.error('❌ Save error:', error.message);
    }
}

// ===== Email পাঠান =====
async function sendEmailWithToken(email, token, packageName) {
    try {
        const baseUrl = process.env.BASE_URL || 'https://physics-premium.vercel.app';
        const accessLink = `${baseUrl}/posts/2026/08/magnetic-effects.html?token=${token}`;
        
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const formattedExpiry = expiryDate.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        console.log('📧 Sending email to:', email);
        console.log('🔗 Access link:', accessLink);

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: 'service_27gemli', 
                template_id: 'template_ycce885',
                user_id: 'hViHPsxs_BAdnj5_O',
                template_params: {
                    name: 'Learning Science Premium',
                    email: email,
                    access_link: accessLink,
                    expiry_date: formattedExpiry
                }
            })
        });

        if (response.ok) {
            console.log('✅ Email sent successfully');
        } else {
            console.error('❌ Email send failed:', await response.text());
        }

    } catch (error) {
        console.error('❌ Email error:', error.message);
    }
}