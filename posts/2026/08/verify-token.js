// api/verify-token.js
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
        const { token, email } = req.body;

        console.log('🔍 Verifying token:', token);
        console.log('📧 Email from request:', email);

        if (!token || !email) {
            return res.status(400).json({ valid: false, error: 'Missing token or email' });
        }

        let isValid = false;
        let decodedEmail = null;

        // Test Token (ডেভেলপমেন্টের জন্য)
        if (token === 'test-token-2026') {
            isValid = true;
            decodedEmail = email;
            console.log('✅ Test token accepted');
        } 
        // Real Token চেক
        else if (token.startsWith('prem_')) {
            console.log('🔍 Processing real token...');
            
            // টোকেন থেকে ইমেইল বের করার নতুন পদ্ধতি
            // Token format: prem_<timestamp>_<base64_email>_<random>
            // কিন্তু base64_email-এ _ থাকতে পারে, তাই সাবধান
            
            // প্রথমে 'prem_' বাদ দিন
            const withoutPrefix = token.substring(5); // 'prem_' এর পরের অংশ
            console.log('📝 Token without prefix:', withoutPrefix);
            
            // আন্ডারস্কোর দিয়ে ভাগ করুন
            const parts = withoutPrefix.split('_');
            console.log('📦 Token parts:', parts);
            
            // parts[0] = timestamp, parts[1] = base64_email, parts[2...] = random (এতে আন্ডারস্কোর থাকতে পারে)
            if (parts.length >= 2) {
                try {
                    // base64_email অংশ নিন (parts[1])
                    const base64Email = parts[1];
                    console.log('🔐 Base64 Email:', base64Email);
                    
                    // ডিকোড করুন
                    decodedEmail = Buffer.from(base64Email, 'base64').toString('utf-8');
                    console.log('📧 Decoded Email:', decodedEmail);
                    
                    // Email মিলিয়ে দেখুন
                    if (decodedEmail && decodedEmail.toLowerCase() === email.toLowerCase()) {
                        isValid = true;
                        console.log(`✅ Token verified for: ${email}`);
                    } else {
                        console.log(`❌ Email mismatch: Token has ${decodedEmail}, Request has ${email}`);
                    }
                } catch (e) {
                    console.error('❌ Decode error:', e);
                    isValid = false;
                }
            } else {
                console.log('❌ Invalid token format - not enough parts');
            }
        } else {
            console.log('❌ Token does not start with prem_');
        }

        if (isValid) {
            return res.status(200).json({ 
                valid: true,
                email: decodedEmail || email,
                message: 'Access granted'
            });
        } else {
            return res.status(200).json({ 
                valid: false, 
                error: 'This link is not valid for this email address. Please use the email you used for payment.',
                debug: {
                    tokenPrefix: token.substring(0, 5),
                    hasEmail: !!decodedEmail,
                    decodedEmail: decodedEmail
                }
            });
        }

    } catch (error) {
        console.error('❌ Error verifying token:', error);
        return res.status(500).json({ valid: false, error: 'Server error: ' + error.message });
    }
}