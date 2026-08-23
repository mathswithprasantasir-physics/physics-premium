// api/blog/[slug].js
import fs from 'fs';
import path from 'path';
import config from '../../data/config.json' assert { type: 'json' };

export default async function handler(req, res) {
  const { slug } = req.query;

  try {
    const postsDir = path.join(process.cwd(), 'data', 'posts');
    let foundPost = null;
    let foundClass = '';
    let foundSubject = '';

    const classes = fs.readdirSync(postsDir);

    for (const cls of classes) {
      const classPath = path.join(postsDir, cls);
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

    // ফ্রি কন্টেন্ট
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
      totalLength: totalLength
    });

  } catch (error) {
    console.error('Error loading post:', error);
    res.status(500).json({ error: 'Failed to load post' });
  }
}