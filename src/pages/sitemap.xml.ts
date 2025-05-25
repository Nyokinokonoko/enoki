import { getAllPosts, getAvailableTags, CATEGORIES } from '../lib/contentful';

const SITE_URL = 'https://notes.kinokonoko.io';

export async function GET() {
  // Get all posts
  const posts = await getAllPosts();
  
  // Get all available tags
  const availableTags = await getAvailableTags();
  const tagNames = Object.keys(availableTags);
  
  // Generate sitemap entries
  const staticPages = [
    {
      url: `${SITE_URL}/`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 1.0
    },
    {
      url: `${SITE_URL}/rss`,
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.5
    }
  ];

  // Add blog posts
  const postPages = posts.map(post => ({
    url: `${SITE_URL}/posts/${post.slug}/`,
    lastmod: new Date(post.date.replace(/\//g, '-')).toISOString(),
    changefreq: 'monthly',
    priority: 0.8
  }));

  // Add category pages (excluding 'all' category since it's the home page)
  const categoryPages = CATEGORIES
    .filter(cat => cat.id !== 'all')
    .map(category => ({
      url: `${SITE_URL}/categories/${category.id}/`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.7
    }));

  // Add tag pages
  const tagPages = tagNames.map(tag => ({
    url: `${SITE_URL}/tags/${encodeURIComponent(tag)}/`,
    lastmod: new Date().toISOString(),
    changefreq: 'weekly',
    priority: 0.6
  }));

  // Combine all pages
  const allPages = [
    ...staticPages,
    ...postPages,
    ...categoryPages,
    ...tagPages
  ];

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
