// api/test.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // ডেটাবেস কানেকশন টেস্ট
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    res.status(200).json({
      success: true,
      message: '✅ Database connected successfully!',
      userCount: userCount,
      environment: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV || 'unknown',
        jwtSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}