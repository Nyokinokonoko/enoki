# Enoki Blog

A blog frontend built with Astro and deployed on Cloudflare Pages.

## Overview

This is the frontend for my personal blog, featuring a clean and responsive design with support for multiple categories and tags. The blog content is managed through Contentful CMS and delivered as a static site.

## Tech Stack

- **Framework**: [Astro](https://astro.build/) - A modern static site generator optimized for speed
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Content Management**: [Contentful](https://www.contentful.com/) - Headless CMS for blog content
- **Markdown Processing**: [marked](https://marked.js.org/) - Markdown parser and compiler
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/) - Fast, secure, and free static site hosting

## Features

- 📝 Dynamic blog post rendering from Contentful
- 🏷️ Category and tag-based content organization
- 📱 Responsive design with modern UI
- ⚡ Fast loading with Astro's static generation
- 🌐 Global CDN delivery via Cloudflare

## Content Categories

- **すべて** (All) - All blog posts
- **開発メモ** (Dev Notes) - Development and programming content
- **ガジェット** (Gadgets) - Technology and gadget reviews
- **たまに思うことがあるですよ** (Random Thoughts) - Personal reflections and thoughts
- **その他** (Other) - Miscellaneous content

## Live Site

The blog is deployed and accessible at [notes.kinokonoko.io](https://notes.kinokonoko.io)

## Project Structure

```
src/
├── components/          # Reusable Astro components
│   ├── BlogList.astro   # Blog post listing component
│   ├── CategoryToggle.astro # Category filter component
│   ├── Footer.astro     # Site footer
│   └── Navbar.astro     # Navigation bar
├── layouts/
│   └── Layout.astro     # Base page layout
├── lib/
│   └── contentful.ts    # Contentful API integration
├── pages/               # Route pages
│   ├── index.astro      # Homepage
│   ├── categories/      # Category-based routing
│   ├── posts/           # Individual post pages
│   └── tags/            # Tag-based routing
└── styles/              # Component-specific CSS
```

## Content Management

Blog content is managed through Contentful CMS, allowing for easy content creation and editing without requiring code changes. The site automatically rebuilds and deploys when new content is published.

### Content Model

The blog uses a structured content model in Contentful with the following fields:

| Field            | Type             | Required | Localized | Description                                              |
| ---------------- | ---------------- | -------- | --------- | -------------------------------------------------------- |
| **Title**        | Symbol           | ✅       | ✅        | The blog post title (unique across all posts)            |
| **Slug**         | Symbol           | ✅       | ❌        | URL-friendly identifier for the post (unique)            |
| **Hero Image**   | Asset Link       | ❌       | ❌        | Optional featured image for the blog post                |
| **Content**      | Text             | ✅       | ✅        | The main blog post content in markdown format            |
| **Publish Date** | Date             | ✅       | ❌        | When the post was published                              |
| **Tags**         | Array of Symbols | ✅       | ❌        | Categorization tags for the post                         |
| **Category**     | Symbol           | ✅       | ❌        | Primary category: `dev`, `thought`, `gadget`, or `other` |
