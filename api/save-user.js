export default async function handler(req, res) {
    // শুধু POST মেথড অনুমোদিত
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userData = req.body;
        
        console.log('📝 User data received:', userData);

        // Google Sheets-এ সেভ করুন
        const SHEET_URL = process.env.GOOGLE_SHEETS_WEBHOOK;
        
        if (SHEET_URL) {
            const response = await fetch(SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            console.log('✅ Google Sheets response:', result);
        } else {
            console.warn('⚠️ GOOGLE_SHEETS_WEBHOOK not configured');
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'User saved',
            user: userData 
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
}