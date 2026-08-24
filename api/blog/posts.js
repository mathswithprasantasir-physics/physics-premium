import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.join(__dirname, '..', '..', 'data', 'posts');

export default async function handler(req, res) {
  const { class: className, subject, search } = req.query;

  try {
    let allPosts = [];

    if (!fs.existsSync(POSTS_DIR)) {
      return res.status(200).json([]);
    }

    const classes = fs.readdirSync(POSTS_DIR);

    for (const cls of classes) {
      if (className && cls !== `class-${className}`) continue;

      const classPath = path.join(POSTS_DIR, cls);
      if (!fs.statSync(classPath).isDirectory()) continue;

      const subjects = fs.readdirSync(classPath);

      for (const sub of subjects) {
        if (subject && sub !== subject) continue;

        const subjectPath = path.join(classPath, sub);
        if (!fs.statSync(subjectPath).isDirectory()) continue;

        const files = fs.readdirSync(subjectPath);

        for (const file of files) {
          if (!file.endsWith('.json')) continue;

          const filePath = path.join(subjectPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const post = JSON.parse(content);

          // Search filter
          if (search) {
            const searchLower = search.toLowerCase();
            const titleMatch = post.title && post.title.toLowerCase().includes(searchLower);
            const subjectMatch = sub.toLowerCase().includes(searchLower);
            const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(searchLower);

            if (!titleMatch && !subjectMatch && !excerptMatch) {
              continue;
            }
          }

          allPosts.push({
            ...post,
            class: cls.replace('class-', ''),
            subject: sub,
            slug: post.id,
          });
        }
      }
    }

    // Sort by date (newest first)
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(allPosts);

  } catch (error) {
    console.error('Error loading posts:', error);
    res.status(500).json({ error: 'Failed to load posts' });
  }
}