// api/verify-session.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ valid: false, error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'fallback_secret';

        const decoded = jwt.verify(token, secret);
        
        res.status(200).json({
            valid: true,
            user: {
                userId: decoded.userId,
                email: decoded.email,
                isAdmin: decoded.isAdmin
            }
        });

    } catch (error) {
        console.error('Session verification error:', error);
        res.status(401).json({ valid: false, error: 'Invalid token' });
    }
}