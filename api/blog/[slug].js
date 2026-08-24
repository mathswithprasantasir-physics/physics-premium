import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.join(__dirname, '..', '..', 'data', 'posts');

export default async function handler(req, res) {
  const { slug } = req.query;

  try {
    // Read config
    const configPath = path.join(__dirname, '..', '..', 'data', 'config.json');
    let config = { freeContentPercent: 30 };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    let foundPost = null;
    let foundClass = '';
    let foundSubject = '';

    if (!fs.existsSync(POSTS_DIR)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const classes = fs.readdirSync(POSTS_DIR);

    for (const cls of classes) {
      const classPath = path.join(POSTS_DIR, cls);
      if (!fs.statSync(classPath).isDirectory()) continue;

      const subjects = fs.readdirSync(classPath);

      for (const sub of subjects) {
        const subjectPath = path.join(classPath, sub);
        if (!fs.statSync(subjectPath).isDirectory()) continue;

        const filePath = path.join(subjectPath, `${slug}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          foundPost = JSON.parse(content);
          foundClass = cls.replace('class-', '');
          foundSubject = sub;
          break;
        }
      }
      if (foundPost) break;
    }

    if (!foundPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Split content: free% preview, rest paid
    const totalLength = foundPost.fullContent.length;
    const freeLength = Math.floor(totalLength * (config.freeContentPercent / 100));
    const freeContent = foundPost.fullContent.substring(0, freeLength);
    const paidContent = foundPost.fullContent.substring(freeLength);

    res.status(200).json({
      ...foundPost,
      class: foundClass,
      subject: foundSubject,
      freeContent: freeContent,
      hasPaidContent: paidContent.length > 0,
      totalLength: totalLength,
      price: foundPost.price || 49,
    });

  } catch (error) {
    console.error('Error loading post:', error);
    res.status(500).json({ error: 'Failed to load post' });
  }
}