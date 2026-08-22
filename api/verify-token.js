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

        // ✅ ১. টোকেন থেকে ইমেইল বের করুন
        const tokenEmail = getEmailFromToken(token);
        console.log('📧 Email from token:', tokenEmail);

        // ✅ ২. টোকেনের ইমেইল এবং ইউজারের ইমেইল মিলিয়ে দেখুন
        if (!tokenEmail || tokenEmail.toLowerCase() !== email.toLowerCase()) {
            console.log(`❌ Email mismatch: ${tokenEmail} vs ${email}`);
            return res.status(200).json({ 
                valid: false, 
                error: `This link is for ${tokenEmail || 'unknown'}, but you are using ${email}` 
            });
        }

        // ✅ ৩. JSON ডেটাবেস থেকে টোকেন চেক করুন
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
                error: 'Invalid token or token expired' 
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

// ===== টোকেন থেকে ইমেইল বের করুন =====
function getEmailFromToken(token) {
    if (!token || !token.startsWith('prem_')) return null;
    
    try {
        const parts = token.split('_');
        if (parts.length >= 3) {
            const base64Email = parts[2];
            const decodedEmail = Buffer.from(base64Email, 'base64').toString('utf-8');
            return decodedEmail;
        }
        return null;
    } catch (e) {
        console.error('Token decode error:', e);
        return null;
    }
}

// ===== JSON ডেটাবেস থেকে ভেরিফাই করুন =====
async function verifyTokenFromDatabase(token, email) {
    try {
        const dataPath = path.join(process.cwd(), 'data', 'tokens.json');
        
        let tokens = [];
        try {
            const fileContent = fs.readFileSync(dataPath, 'utf8');
            tokens = JSON.parse(fileContent);
            console.log('📦 Database has', tokens.length, 'tokens');
        } catch (error) {
            console.log('⚠️ tokens.json not found');
            return false;
        }

        const tokenData = tokens.find(t => t.token === token);
        
        if (!tokenData) {
            console.log('❌ Token not found in database');
            return false;
        }

        if (tokenData.email.toLowerCase() !== email.toLowerCase()) {
            console.log(`❌ Email mismatch: ${tokenData.email} vs ${email}`);
            return false;
        }

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