// api/verify-payment.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

        console.log('📦 Payment verification:', { email, packageName, amount });

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!secret) {
            return res.status(500).json({ success: false, message: 'Razorpay secret not configured' });
        }

        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        if (generatedSignature === signature) {
            console.log('✅ Payment verified for:', email);

            // ✅ টোকেন জেনারেট
            const token = generateSecureToken(email);
            console.log('🔑 Token generated:', token);

            // ✅ JSON ডেটাবেসে সেভ
            const saved = await saveTokenToDatabase(email, token, packageName, paymentId, amount);
            
            if (!saved) {
                console.error('❌ Failed to save token to database');
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to save token' 
                });
            }

            // ✅ ইমেইল পাঠান
            await sendEmailWithToken(email, token, packageName);

            res.status(200).json({
                success: true,
                paymentId: paymentId,
                token: token,
                email: email,
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

// ===== সিকিউর টোকেন জেনারেট =====
function generateSecureToken(email) {
    const encodedEmail = Buffer.from(email).toString('base64');
    const safeEmail = encodedEmail
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    
    return `prem_${timestamp}_${safeEmail}_${random}`;
}

// ===== JSON ডেটাবেসে টোকেন সেভ করুন =====
async function saveTokenToDatabase(email, token, packageName, paymentId, amount) {
    try {
        // data ফোল্ডার তৈরি করুন (যদি না থাকে)
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('📁 Created data directory');
        }

        const dataPath = path.join(dataDir, 'tokens.json');
        console.log('📂 Saving to:', dataPath);
        
        // পুরানো ডেটা পড়ুন
        let tokens = [];
        try {
            const fileContent = fs.readFileSync(dataPath, 'utf8');
            tokens = JSON.parse(fileContent);
            console.log('📦 Existing tokens:', tokens.length);
        } catch (error) {
            console.log('⚠️ No existing tokens, creating new file');
            tokens = [];
        }

        // নতুন টোকেন যোগ করুন
        const newToken = {
            email: email,
            token: token,
            packageName: packageName || 'Unknown',
            paymentId: paymentId || 'N/A',
            amount: amount || 0,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        tokens.push(newToken);

        // ফাইলে সেভ করুন
        fs.writeFileSync(dataPath, JSON.stringify(tokens, null, 2));
        console.log('✅ Token saved to JSON database. Total:', tokens.length);

        return true;

    } catch (error) {
        console.error('❌ Database save error:', error.message);
        return false;
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: 'service_27gemli', 
                template_id: 'template_ycce885',
                user_id: 'hViHPsxs_BAdnj5_O',
                template_params: {
                    name: 'Learning Science Premium',
                    email: email,
                    access_link: accessLink,
                    expiry_date: formattedExpiry,
                    security_note: 'This link is tied to your email. Do not share it with anyone.'
                }
            })
        });

        if (response.ok) {
            console.log('✅ Email sent successfully');
        } else {
            console.error('❌ Email failed:', await response.text());
        }
    } catch (error) {
        console.error('❌ Email error:', error.message);
    }
}