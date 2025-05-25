import * as contentful from "contentful";
import type { EntryFieldTypes } from "contentful";

export const contentfulClient = contentful.createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.NODE_ENV === "development"
    ? import.meta.env.CONTENTFUL_PREVIEW_TOKEN
    : import.meta.env.CONTENTFUL_DELIVERY_TOKEN,
  host: import.meta.env.NODE_ENV === "development" ? "preview.contentful.com" : "cdn.contentful.com",
});

export const CATEGORIES = [
  { id: "all", label: "すべて" },
  { id: "dev", label: "開発メモ" },
  { id: "gadget", label: "ガジェット" },
  { id: "thought", label: "たまに思うことがあるですよ" },
  { id: "other", label: "その他" }
];

export interface BlogPost {
    contentTypeId: "blogPost";
    fields: {
        title: EntryFieldTypes.Text;
        slug: EntryFieldTypes.Text;
        heroImage?: EntryFieldTypes.AssetLink;
        content: EntryFieldTypes.Text;
        metaDescription: EntryFieldTypes.Text;
        publishDate: EntryFieldTypes.Date;
        tags: EntryFieldTypes.Array<EntryFieldTypes.Symbol>;
        category: EntryFieldTypes.Text;
    }
}

export interface FilteredPost {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  category: string;
  rawDate?: Date; // Optional temporary property used for sorting
}

export interface DetailedPost extends FilteredPost {
  content: string;
  metaDescription: string;
}

export async function getAllPosts(): Promise<FilteredPost[]> {
  const entries = await contentfulClient.getEntries<BlogPost>({
    content_type: "blogPost",
  });
    const posts = entries.items.map((item) => {
    const { title, publishDate, slug, tags, category } = item.fields;
    const date = new Date(publishDate);
    
    // Format date as YYYY/MM/DD with leading zeros for single-digit day/month
    const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    
    return {
      title,
      slug,
      date: formattedDate,
      rawDate: date, // Keep the raw date for sorting
      tags: tags || [],
      category: category || 'other'
    };
  });
  
  // Sort posts by date in descending order (newest first)
  return posts.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    .map(({ title, slug, date, tags, category }) => ({ title, slug, date, tags, category })); // Remove the rawDate property from the final result
}

export async function getPostsByCategory(category: string): Promise<FilteredPost[]> {
  const allPosts = await getAllPosts();
  
  if (!category || category === 'all') {
    return allPosts;
  }
  
  return allPosts.filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getAvailableCategories(): Promise<Record<string, number>> {
  const allPosts = await getAllPosts();
  const categoryCounts: Record<string, number> = {};
  
  // Initialize with our predefined categories (excluding "all")
  CATEGORIES.filter(cat => cat.id !== "all").forEach(category => {
    categoryCounts[category.id] = 0;
  });
  
  // Count posts for each category
  allPosts.forEach(post => {
    const normalizedCategory = post.category.trim().toLowerCase();
    categoryCounts[normalizedCategory] = (categoryCounts[normalizedCategory] || 0) + 1;
  });
  
  // Add count for "all" category
  categoryCounts["all"] = allPosts.length;
  
  return categoryCounts;
}

// Backward compatibility functions for tag-based filtering
export async function getPostsByTag(tag: string): Promise<FilteredPost[]> {
  const allPosts = await getAllPosts();
  
  if (!tag || tag === 'all') {
    return allPosts;
  }
  
  return allPosts.filter(post => 
    post.tags.some(t => t.trim().toLowerCase() === tag.toLowerCase())
  );
}

export async function getAvailableTags(): Promise<Record<string, number>> {
  const allPosts = await getAllPosts();
  const tagCounts: Record<string, number> = {};
  
  // Count posts for each tag
  allPosts.forEach(post => {
    post.tags.forEach(tag => {
      const normalizedTag = tag.trim().toLowerCase();
      tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
    });
  });
  
  return tagCounts;
}

export async function getPostDetails(slug: string): Promise<DetailedPost | null> {
  const entries = await contentfulClient.getEntries<BlogPost>({
    content_type: "blogPost",
    "fields.slug": slug,
  });
  
  const item = entries.items[0];
  if (!item) {
    return null;
  }
  
  const { title, publishDate, slug: postSlug, tags, category, content, metaDescription } = item.fields;
  const date = new Date(publishDate);
  
  // Format date as YYYY/MM/DD with leading zeros for single-digit day/month
  const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  
  return {
    title,
    slug: postSlug,
    date: formattedDate,
    rawDate: date, // Keep the raw date for sorting
    tags: tags || [],
    category: category || 'other',
    content: content || '',
    metaDescription: metaDescription || '',
  };
}

export async function getAllPostsWithContent(): Promise<DetailedPost[]> {
  const entries = await contentfulClient.getEntries<BlogPost>({
    content_type: "blogPost",
  });
  
  const posts = entries.items.map((item) => {
    const { title, publishDate, slug, tags, category, content, metaDescription } = item.fields;
    const date = new Date(publishDate);
    
    // Format date as YYYY/MM/DD with leading zeros for single-digit day/month
    const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    
    return {
      title,
      slug,
      date: formattedDate,
      rawDate: date, // Keep the raw date for sorting
      tags: tags || [],
      category: category || 'other',
      content: content || '',
      metaDescription: metaDescription || `${title} - Read this blog post on notes.kinokonoko.io`
    };
  });
  
  // Sort posts by date in descending order (newest first)
  return posts.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    .map(({ title, slug, date, tags, category, content, metaDescription }) => ({ 
      title, slug, date, tags, category, content, metaDescription 
    })); // Remove the rawDate property from the final result
}

export async function getPostsByCategoryWithContent(category: string): Promise<DetailedPost[]> {
  const allPosts = await getAllPostsWithContent();
  
  if (!category || category === 'all') {
    return allPosts;
  }
  
  return allPosts.filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  );
}
