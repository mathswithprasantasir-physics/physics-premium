// api/verify-token.js
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
        const { token, email } = req.body;

        console.log('🔍 Verifying token for email:', email);
        console.log('🔑 Token:', token);

        if (!token || !email) {
            return res.status(400).json({ 
                valid: false, 
                error: 'Missing token or email' 
            });
        }

        // Test Token
        if (token === 'test-token-2026') {
            console.log('✅ Test token accepted');
            return res.status(200).json({ 
                valid: true,
                email: email,
                message: 'Test access granted'
            });
        }

        // Real Token verify
        if (!token.startsWith('prem_')) {
            console.log('❌ Invalid token prefix');
            return res.status(200).json({ 
                valid: false, 
                error: 'Invalid token format' 
            });
        }

        // Token পার্স করুন
        const parts = token.split('_');
        console.log('📦 Token parts:', parts);

        // টোকেনের ফরম্যাট: prem_<timestamp>_<base64email>_<random>
        if (parts.length < 3) {
            console.log('❌ Token has less than 3 parts');
            return res.status(200).json({ 
                valid: false, 
                error: 'Invalid token structure' 
            });
        }

        try {
            // Base64 অংশ নিন (parts[2])
            const base64Email = parts[2];
            console.log('🔐 Base64 email from token:', base64Email);

            // ডিকোড করুন
            const decodedEmail = Buffer.from(base64Email, 'base64').toString('utf-8');
            console.log('📧 Decoded email:', decodedEmail);

            // Email মিলিয়ে দেখুন
            if (decodedEmail && decodedEmail.toLowerCase() === email.toLowerCase()) {
                console.log('✅ Token verified successfully!');
                return res.status(200).json({ 
                    valid: true,
                    email: decodedEmail,
                    message: 'Access granted'
                });
            } else {
                console.log(`❌ Email mismatch: ${decodedEmail} vs ${email}`);
                return res.status(200).json({ 
                    valid: false, 
                    error: `This link is for ${decodedEmail}, but you are trying with ${email}`
                });
            }

        } catch (decodeError) {
            console.error('❌ Decode error:', decodeError);
            return res.status(200).json({ 
                valid: false, 
                error: 'Invalid token encoding' 
            });
        }

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({ 
            valid: false, 
            error: 'Server error: ' + error.message 
        });
    }
}