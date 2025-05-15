import * as contentful from "contentful";
import type { EntryFieldTypes } from "contentful";

export const contentfulClient = contentful.createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.DEV
    ? import.meta.env.CONTENTFUL_PREVIEW_TOKEN
    : import.meta.env.CONTENTFUL_DELIVERY_TOKEN,
  host: import.meta.env.DEV ? "preview.contentful.com" : "cdn.contentful.com",
});

export interface BlogPost {
    contentTypeId: "blogPost";
    fields: {
        title: EntryFieldTypes.Text;
        slug: EntryFieldTypes.Text;
        heroImage?: EntryFieldTypes.AssetLink;
        content: EntryFieldTypes.RichText;
        publishDate: EntryFieldTypes.Date;
        tags: EntryFieldTypes.Array<EntryFieldTypes.Symbol>;
    }
}