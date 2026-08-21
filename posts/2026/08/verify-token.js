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

        // ===== Token থেকে Email বের করা =====
        let tokenEmail = null;
        try {
            if (token.startsWith('prem_')) {
                const parts = token.split('_');
                if (parts.length >= 3) {
                    tokenEmail = atob(parts[2]); // Decode base64
                }
            }
        } catch (e) {
            tokenEmail = null;
        }

        // ===== Token এবং Email মিলছে কিনা চেক =====
        if (tokenEmail && tokenEmail.toLowerCase() === email.toLowerCase()) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(200).json({ valid: false, error: 'Token does not match email' });
        }

    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(500).json({ valid: false, error: 'Server error' });
    }
}