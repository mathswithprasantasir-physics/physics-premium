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
            
            // ১. ইউজারের জন্য টোকেন জেনারেট করুন
            const token = generateToken(email, packageName);
            
            // ২. ডেটাবেসে ইউজার সেভ করুন
            await saveUserToDatabase(email, packageName, token, paymentId, amount);
            
            // ৩. অটোমেটিক ইমেইল পাঠান
            await sendAccessEmail(email, token, packageName);
            
            res.status(200).json({
                success: true,
                paymentId: paymentId,
                token: token,
                message: 'Payment verified and access link sent!'
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

// ===== টোকেন জেনারেট =====
function generateToken(email, packageName) {
    const encodedEmail = btoa(email);
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return 'prem_' + timestamp + '_' + encodedEmail + '_' + random;
}

// ===== ডেটাবেসে সেভ =====
async function saveUserToDatabase(email, packageName, token, paymentId, amount) {
    try {
        // Google Sheets API (আপনি Firebase বা অন্য ডেটাবেসও ব্যবহার করতে পারেন)
        const response = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                package: packageName,
                token: token,
                paymentId: paymentId,
                amount: amount,
                createdAt: new Date().toISOString()
            })
        });
        console.log('✅ User saved to database:', email);
    } catch (error) {
        console.error('Database save error:', error);
    }
}

// ===== অটোমেটিক ইমেইল =====
async function sendAccessEmail(email, token, packageName) {
    try {
        const baseUrl = process.env.BASE_URL || 'https://physics-premium.vercel.app';
        const accessLink = `${baseUrl}/posts/2026/08/magnetic-effects.html?token=${token}`;
        
        // EmailJS বা Nodemailer ব্যবহার করুন
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_USER_ID,
                template_params: {
                    to_email: email,
                    access_link: accessLink,
                    package_name: packageName || 'Premium Notes',
                    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
                }
            })
        });
        
        console.log('✅ Email sent to:', email);
    } catch (error) {
        console.error('Email send error:', error);
    }
}