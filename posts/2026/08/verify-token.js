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

        // Test Token
        if (token === 'test-token-2026') {
            isValid = true;
        } 
        // Real Token চেক
        else if (token.startsWith('prem_')) {
            const parts = token.split('_');
            
            // Token format: prem_<timestamp>_<base64_email>_<random>
            if (parts.length >= 3) {
                try {
                    // Node.js Buffer দিয়ে সঠিকভাবে Decode করুন
                    const decodedEmail = Buffer.from(parts[2], 'base64').toString('utf-8');
                    
                    // Token-এর Email এবং Browser-এর Email মিলিয়ে দেখুন
                    if (decodedEmail && decodedEmail.toLowerCase() === email.toLowerCase()) {
                        isValid = true; 
                    }
                } catch (e) {
                    isValid = false;
                }
            }
        }

        if (isValid) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(200).json({ valid: false, error: 'Token does not match email' });
        }

    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ valid: false, error: 'Server error' });
    }
}