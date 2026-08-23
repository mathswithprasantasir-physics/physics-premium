// api/blog/posts.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { class: className, subject, search } = req.query;

  try {
    const postsDir = path.join(process.cwd(), 'data', 'posts');
    let allPosts = [];

    const classes = fs.readdirSync(postsDir);

    for (const cls of classes) {
      if (className && cls !== `class-${className}`) continue;

      const classPath = path.join(postsDir, cls);
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

          if (search && !post.title.toLowerCase().includes(search.toLowerCase())) {
            continue;
          }

          allPosts.push({
            ...post,
            class: cls.replace('class-', ''),
            subject: sub,
            slug: post.id
          });
        }
      }
    }

    // সাজানো (নতুন থেকে পুরনো)
    allPosts.sort((a, b) => a.id.localeCompare(b.id));

    res.status(200).json(allPosts);

  } catch (error) {
    console.error('Error loading posts:', error);
    res.status(500).json({ error: 'Failed to load posts' });
  }
}