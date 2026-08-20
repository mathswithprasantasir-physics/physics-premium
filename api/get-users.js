export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('📊 Fetching users from Google Sheets...');

        const SHEET_URL = process.env.GOOGLE_SHEETS_WEBHOOK;
        
        if (!SHEET_URL) {
            console.warn('⚠️ GOOGLE_SHEETS_WEBHOOK not configured');
            return res.status(200).json({ 
                users: [],
                message: 'Webhook not configured' 
            });
        }

        console.log('📤 Fetching from:', SHEET_URL);

        const response = await fetch(SHEET_URL);
        const text = await response.text(); // প্রথমে text হিসেবে নিন
        console.log('📦 Raw response:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ JSON parse error:', e);
            return res.status(500).json({ 
                users: [], 
                error: 'Invalid JSON from Google Sheets' 
            });
        }

        if (data.success) {
            const users = data.users || [];
            const formattedUsers = users.map(user => ({
                email: user.Email || 'Unknown',
                package: user.Package || 'Unknown',
                token: user.Token || 'N/A',
                paymentId: user['Payment ID'] || 'N/A',
                amount: parseInt(user.Amount) || 0,
                createdAt: user['Created At'] || new Date().toISOString(),
                expiresAt: user['Expires At'] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                isActive: new Date(user['Expires At']) > new Date()
            }));

            console.log(`✅ ${formattedUsers.length} users fetched`);
            res.status(200).json({ 
                users: formattedUsers,
                total: formattedUsers.length
            });
        } else {
            throw new Error(data.error || 'Failed to fetch users');
        }
    } catch (error) {
        console.error('❌ Fetch error:', error);
        res.status(500).json({ 
            users: [], 
            error: error.message 
        });
    }
}