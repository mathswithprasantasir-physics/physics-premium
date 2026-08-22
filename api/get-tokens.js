// api/get-tokens.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // ✅ অ্যাডমিন চেক
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // ✅ Prisma দিয়ে সব টোকেন পাওয়া
        const tokens = await prisma.accessToken.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        fullName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // ✅ ফরম্যাট করা ডেটা
        const formattedTokens = tokens.map(t => ({
            email: t.user.email,
            fullName: t.user.fullName,
            token: t.token,
            packageName: t.packageName,
            amount: t.amount,
            paymentId: t.paymentId,
            createdAt: t.createdAt,
            expiresAt: t.expiresAt,
            isActive: t.isActive
        }));

        res.status(200).json({
            total: formattedTokens.length,
            tokens: formattedTokens
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
}