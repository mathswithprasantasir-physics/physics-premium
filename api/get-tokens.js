// api/get-tokens.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // ✅ অ্যাডমিন চেক (সিকিউরিটি)
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const dataPath = path.join(process.cwd(), 'data', 'tokens.json');
        
        let tokens = [];
        try {
            const fileContent = fs.readFileSync(dataPath, 'utf8');
            tokens = JSON.parse(fileContent);
        } catch (error) {
            tokens = [];
        }

        res.status(200).json({
            total: tokens.length,
            tokens: tokens
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
}