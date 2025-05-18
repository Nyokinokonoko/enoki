import * as contentful from "contentful";
import type { EntryFieldTypes } from "contentful";

export const contentfulClient = contentful.createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.DEV
    ? import.meta.env.CONTENTFUL_PREVIEW_TOKEN
    : import.meta.env.CONTENTFUL_DELIVERY_TOKEN,
  host: import.meta.env.DEV ? "preview.contentful.com" : "cdn.contentful.com",
});

export const CATEGORIES = [
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
        publishDate: EntryFieldTypes.Date;
        tags: EntryFieldTypes.Array<EntryFieldTypes.Symbol>;
    }
}

export interface FilteredPost {
  title: string;
  slug: string;
  date: string;
  tags: string[];
}

export async function getAllPosts(): Promise<FilteredPost[]> {
  const entries = await contentfulClient.getEntries<BlogPost>({
    content_type: "blogPost",
  });
  
  return entries.items.map((item) => {
    const { title, publishDate, slug, tags } = item.fields;
    return {
      title,
      slug,
      date: new Date(publishDate).toLocaleDateString(),
      tags: tags || []
    };
  });
}

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
  
  // Initialize with our predefined tags
  CATEGORIES.forEach(category => {
    tagCounts[category.id] = 0;
  });
  
  // Count posts for each tag
  allPosts.forEach(post => {
    post.tags.forEach(tag => {
      const normalizedTag = tag.trim().toLowerCase();
      tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
    });
  });
  
  return tagCounts;
}
