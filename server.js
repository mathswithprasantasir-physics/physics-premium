import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// API Handlers
import loginHandler from './api/auth/login.js';
import registerHandler from './api/auth/register.js';
import verifySessionHandler from './api/auth/verify-session.js';
import postsHandler from './api/blog/posts.js';
import postSlugHandler from './api/blog/[slug].js';
import dashboardHandler from './api/dashboard/index.js';
import createOrderHandler from './api/payment/create-order.js';
import verifyPaymentHandler from './api/payment/verify-payment.js';
import testHandler from './api/test.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to adapt Vercel-style handlers to Express
function adaptHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

// API Routes
app.all('/api/auth/login', adaptHandler(loginHandler));
app.all('/api/auth/register', adaptHandler(registerHandler));
app.all('/api/auth/verify-session', adaptHandler(verifySessionHandler));
app.all('/api/blog/posts', adaptHandler(postsHandler));
app.all('/api/blog/:slug', (req, res, next) => {
  req.query.slug = req.params.slug;
  return adaptHandler(postSlugHandler)(req, res, next);
});
app.all('/api/dashboard', adaptHandler(dashboardHandler));
app.all('/api/payment/create-order', adaptHandler(createOrderHandler));
app.all('/api/payment/verify-payment', adaptHandler(verifyPaymentHandler));
app.all('/api/test', adaptHandler(testHandler));

// Static files
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use(express.static(path.join(__dirname, 'public')));

// HTML Views
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/browse', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'browse.html'));
});
app.get('/browse.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'browse.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog-post.html'));
});

// Dashboard routes
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard', 'index.html'));
});
app.get('/dashboard/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard', 'index.html'));
});
app.get('/dashboard/my-purchases', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard', 'my-purchases.html'));
});
app.get('/dashboard/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard', 'profile.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Physics Premium server running on http://localhost:${PORT}`);
});

// For Vercel serverless
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}