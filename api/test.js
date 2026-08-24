import { db } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const userCount = db.users.count();

    res.status(200).json({
      success: true,
      message: '✅ API is working!',
      userCount: userCount,
      environment: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV || 'unknown',
      },
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}