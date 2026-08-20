export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userData = req.body;
        
        // Vercel-এ ফাইল সিস্টেমে সেভ করা যায় না, তাই localStorage-এ সেভ করার API
        // অথবা Google Sheets-এ সেভ করুন
        
        console.log('📝 User data received:', userData);
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}