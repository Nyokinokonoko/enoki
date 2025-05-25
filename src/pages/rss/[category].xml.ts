import rss from '@astrojs/rss';
import { getPostsByCategoryWithContent, CATEGORIES } from '../../lib/contentful';
import type { APIContext } from 'astro';

export async function getStaticPaths() {
  // Generate RSS feeds for each category except "all"
  return CATEGORIES.filter(cat => cat.id !== 'all').map(category => ({
    params: { category: category.id },
    props: { categoryLabel: category.label }
  }));
}

export async function GET(context: APIContext) {
  const { category } = context.params;
  const { categoryLabel } = context.props;
  
  if (!category || typeof category !== 'string') {
    return new Response('Category not found', { status: 404 });
  }
  
  const posts = await getPostsByCategoryWithContent(category);
  
  return rss({
    title: `${categoryLabel} | notes.kinokonoko.io`,
    description: `${categoryLabel} posts from notes.kinokonoko.io`,
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
