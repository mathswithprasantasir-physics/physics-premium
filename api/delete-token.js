// api/delete-token.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

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

        // ✅ Prisma দিয়ে টোকেন ডিলিট
        const deleted = await prisma.accessToken.delete({
            where: { token: token }
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Token not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Token deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
}