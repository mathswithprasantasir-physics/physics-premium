import { db } from '../../lib/db.js';
import bcrypt from 'bcryptjs';

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
      return res.status(400).json({ error: 'Email and password required' });
    }

    // ✅ Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // ✅ Email validation
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const existing = db.users.findUnique({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = db.users.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName ? fullName.trim() : '',
      phone: phone ? phone.trim() : '',
      isAdmin: false,
      isActive: true,
      lastLogin: null,
    });

    res.status(201).json({
      success: true,
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName 
      },
      message: 'Registration successful!'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}