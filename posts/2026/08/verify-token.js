// api/verify-token.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token, email } = req.body;

        if (!token || !email) {
            return res.status(400).json({ valid: false, error: 'Missing token or email' });
        }

        let isValid = false;
        let decodedEmail = null;

        // Test Token (ডেভেলপমেন্টের জন্য)
        if (token === 'test-token-2026') {
            isValid = true;
            decodedEmail = email;
        } 
        // Real Token চেক
        else if (token.startsWith('prem_')) {
            const parts = token.split('_');
            
            // Token format: prem_<timestamp>_<base64_email>_<random>
            if (parts.length >= 3) {
                try {
                    // Node.js Buffer দিয়ে সঠিকভাবে Decode করুন
                    decodedEmail = Buffer.from(parts[2], 'base64').toString('utf-8');
                    
                    // Token-এর Email এবং Browser-এর Email মিলিয়ে দেখুন
                    if (decodedEmail && decodedEmail.toLowerCase() === email.toLowerCase()) {
                        isValid = true;
                        console.log(`✅ Token verified for: ${email}`);
                    } else {
                        console.log(`❌ Email mismatch: Token has ${decodedEmail}, Request has ${email}`);
                    }
                } catch (e) {
                    console.error('Decode error:', e);
                    isValid = false;
                }
            }
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
                error: 'This link is not valid for this email address. Please use the email you used for payment.'
            });
        }

    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ valid: false, error: 'Server error' });
    }
}