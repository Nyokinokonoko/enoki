import rss from '@astrojs/rss';
import { getAllPostsWithContent } from '../lib/contentful';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getAllPostsWithContent();
  
  return rss({
    title: 'notes.kinokonoko.io',
    description: 'A personal blog about development, gadgets, thoughts, and more',
    site: context.site!,
    items: posts.map(post => ({
      title: post.title,
      pubDate: new Date(post.date.replace(/\//g, '-')), // Convert YYYY/MM/DD to YYYY-MM-DD
      description: post.metaDescription,
      content: post.content.slice(0, 500) + (post.content.length > 500 ? '...' : ''), // Truncate content for RSS
      link: `/posts/${post.slug}/`,
      categories: [post.category, ...post.tags],
    })),
    customData: `<language>ja-JP</language>`,
  });
}
