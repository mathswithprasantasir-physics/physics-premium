// api/register.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
        const { email, password, fullName, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // ✅ ইউজার চেক
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // ✅ পাসওয়ার্ড হ্যাশ
        const passwordHash = await bcrypt.hash(password, 10);

        // ✅ ইউজার তৈরি
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName: fullName || '',
                phone: phone || ''
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                createdAt: true
            }
        });

        res.status(201).json({
            success: true,
            user,
            message: 'Registration successful! Please login.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}