import { getUserFromRequest } from '../../lib/auth.js';
import { db } from '../../lib/db.js';

export default async function handler(req, res) {
  // ✅ CORS Headers
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
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const purchases = db.purchases.findMany({ userId: user.userId });
    const downloads = db.downloads.findMany({ userId: user.userId });
    const accessTokens = db.accessTokens.findMany({ 
      userId: user.userId, 
      isActive: true 
    });

    // ✅ Check token expiry
    const validTokens = accessTokens.filter(token => 
      new Date(token.expiresAt) > new Date()
    );

    const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    res.status(200).json({
      success: true,
      totalPurchases: purchases.length,
      totalDownloads: downloads.length,
      totalSpent: totalSpent,
      activeTokens: validTokens.length,
      recentPurchases: purchases.slice(0, 10).map(p => ({
        id: p.id,
        postId: p.postId,
        postTitle: p.postTitle,
        postClass: p.postClass || '',
        postSubject: p.postSubject || '',
        amount: p.amount,
        purchasedAt: p.createdAt,
      })),
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
}