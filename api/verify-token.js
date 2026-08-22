// api/verify-token.js
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
        const { token, email } = req.body;

        console.log('🔍 Verifying token for email:', email);
        console.log('🔑 Token:', token);

        if (!token || !email) {
            return res.status(200).json({ 
                valid: false, 
                error: 'Missing token or email' 
            });
        }

        // ✅ JSON ডেটাবেস থেকে টোকেন চেক করুন
        const isValid = await verifyTokenFromDatabase(token, email);

        if (isValid) {
            return res.status(200).json({ 
                valid: true,
                email: email,
                message: 'Access granted'
            });
        } else {
            return res.status(200).json({ 
                valid: false, 
                error: 'Invalid token or email mismatch' 
            });
        }

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({ 
            valid: false, 
            error: 'Server error' 
        });
    }
}

// ===== JSON ডেটাবেস থেকে ভেরিফাই করুন =====
async function verifyTokenFromDatabase(token, email) {
    try {
        // Vercel-এ JSON ফাইলের পাথ
        const dataPath = path.join(process.cwd(), 'data', 'tokens.json');
        
        // ফাইল পড়ুন
        let tokens = [];
        try {
            const fileContent = fs.readFileSync(dataPath, 'utf8');
            tokens = JSON.parse(fileContent);
        } catch (error) {
            // ফাইল না থাকলে খালি অ্যারে
            tokens = [];
        }

        // টোকেন খুঁজুন
        const tokenData = tokens.find(t => t.token === token);
        
        if (!tokenData) {
            console.log('❌ Token not found in database');
            return false;
        }

        // ইমেইল মিলিয়ে দেখুন
        if (tokenData.email.toLowerCase() !== email.toLowerCase()) {
            console.log(`❌ Email mismatch: ${tokenData.email} vs ${email}`);
            return false;
        }

        // এক্সপাইরি চেক করুন
        if (tokenData.expiresAt && new Date(tokenData.expiresAt) < new Date()) {
            console.log('❌ Token expired');
            return false;
        }

        console.log('✅ Token verified from database');
        return true;

    } catch (error) {
        console.error('❌ Database error:', error);
        return false;
    }
}