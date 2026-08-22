// api/delete-token.js
import fs from 'fs';
import path from 'path';

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
        // ✅ অ্যাডমিন চেক
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }

        const dataPath = path.join(process.cwd(), 'data', 'tokens.json');
        
        let tokens = [];
        try {
            const fileContent = fs.readFileSync(dataPath, 'utf8');
            tokens = JSON.parse(fileContent);
        } catch (error) {
            tokens = [];
        }

        // টোকেন রিমুভ করুন
        const filteredTokens = tokens.filter(t => t.token !== token);
        
        if (filteredTokens.length === tokens.length) {
            return res.status(404).json({ error: 'Token not found' });
        }

        fs.writeFileSync(dataPath, JSON.stringify(filteredTokens, null, 2));
        
        res.status(200).json({
            success: true,
            message: 'Token deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
}