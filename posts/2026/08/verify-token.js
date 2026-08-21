// api/verify-token.js
export default async function handler(req, res) {
    console.log('🚀 verify-token API hit...'); // API called হয়েছে কিনা
    console.log('📦 Request method:', req.method);

    if (req.method !== 'POST') {
        console.log('❌ Method not allowed');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token } = req.body;
        console.log('🔑 Token received from frontend:', token);

        if (!token) {
            console.log('❌ Missing token');
            return res.status(400).json({ valid: false, error: 'Missing token' });
        }

        let isValid = false;

        // Test Token
        if (token === 'test-token-2026') {
            console.log('✅ Test token detected. Valid!');
            isValid = true;
        } 
        // Real Token চেক
        else if (token.startsWith('prem_')) {
            console.log('🔍 Token starts with prem_. Checking parts...');
            const parts = token.split('_');
            console.log('📄 Token parts:', parts);
            
            if (parts.length >= 3) {
                try {
                    // Base64 Decode করে Email বের করা
                    const decodedEmail = atob(parts[2]);
                    console.log('📧 Decoded email from token:', decodedEmail);
                    
                    if (decodedEmail && decodedEmail.includes('@')) {
                        console.log('✅ Valid email found in token. Valid!');
                        isValid = true; 
                    } else {
                        console.log('❌ Decoded email is not valid');
                    }
                } catch (e) {
                    console.log('❌ Base64 decode error:', e.message);
                    isValid = false;
                }
            } else {
                console.log('❌ Token parts are less than 3');
            }
        } else {
            console.log('❌ Token does not start with prem_');
        }

        console.log('🏁 Final validation result (isValid):', isValid);

        if (isValid) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(200).json({ valid: false, error: 'Invalid token structure' });
        }

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({ valid: false, error: 'Server error' });
    }
}