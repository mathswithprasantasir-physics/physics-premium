// api/verify-token.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ valid: false, error: 'Missing token' });
        }

        // Token Valid কিনা চেক করা (শুধুমাত্র Token-এর ভিত্তিতে)
        let isValid = false;

        // Test Token
        if (token === 'test-token-2026') {
            isValid = true;
        } 
        // Real Token চেক
        else if (token.startsWith('prem_')) {
            const parts = token.split('_');
            if (parts.length >= 3) {
                try {
                    // Base64 Decode করে Email বের করা
                    const decodedEmail = atob(parts[2]);
                    if (decodedEmail && decodedEmail.includes('@')) {
                        isValid = true; // Token-এ সঠিক Email থাকলেই Valid
                    }
                } catch (e) {
                    isValid = false;
                }
            }
        }

        if (isValid) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(200).json({ valid: false, error: 'Invalid token structure' });
        }

    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ valid: false, error: 'Server error' });
    }
}