// api/verify-token.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        // ✅ টোকেন থেকে ইমেইল বের করুন
        const tokenEmail = getEmailFromToken(token);
        console.log('📧 Email from token:', tokenEmail);

        // ✅ টোকেনের ইমেইল এবং ইউজারের ইমেইল মিলিয়ে দেখুন
        if (!tokenEmail || tokenEmail.toLowerCase() !== email.toLowerCase()) {
            return res.status(200).json({ 
                valid: false, 
                error: `This link is for ${tokenEmail || 'unknown'}, but you are using ${email}` 
            });
        }

        // ✅ Prisma দিয়ে টোকেন চেক করুন
        const tokenData = await prisma.accessToken.findFirst({
            where: {
                token: token,
                isActive: true,
                expiresAt: { gt: new Date() }
            },
            include: {
                user: {
                    select: { email: true, id: true }
                }
            }
        });

        if (!tokenData) {
            return res.status(200).json({ 
                valid: false, 
                error: 'Invalid or expired token' 
            });
        }

        // ✅ অ্যাক্সেস লগ
        await prisma.accessLog.create({
            data: {
                userId: tokenData.userId,
                token: token,
                ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown'
            }
        });

        console.log('✅ Access granted for:', email);
        res.status(200).json({ 
            valid: true,
            email: email,
            userId: tokenData.userId,
            message: 'Access granted'
        });

    } catch (error) {
        console.error('❌ Token verification error:', error);
        res.status(500).json({ valid: false, error: 'Server error' });
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