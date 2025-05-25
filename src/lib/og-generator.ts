import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Create SVG template for OG image with basic fallback styling
 */
function createOGTemplate(title: string, subtitle?: string) {
  const hasSubtitle = subtitle && subtitle.trim().length > 0;
  
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        position: 'relative',
        padding: '40px',
        boxSizing: 'border-box',
      },
      children: [
        // Gradient border
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              borderRadius: '24px',
              background: 'linear-gradient(83.21deg, #d4a700 0%, #b8860b 100%)',
              padding: '8px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                  }
                }
              }
            ]
          }
        },
        // Content container
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              zIndex: 1,
              position: 'relative',
              maxWidth: '1000px',
              padding: '0 60px',
            },
            children: [
              // Main title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: hasSubtitle ? '72px' : '84px',
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: 1.1,
                    marginBottom: hasSubtitle ? '24px' : '0',
                    fontFamily: "'Noto Sans JP', Arial, sans-serif",
                    wordBreak: 'break-word',
                  },
                  children: title
                }
              },
              // Subtitle
              ...(hasSubtitle ? [{
                type: 'div',
                props: {
                  style: {
                    fontSize: '36px',
                    fontWeight: 400,
                    color: '#4b5563',
                    fontFamily: "'Noto Sans JP', Arial, sans-serif",
                  },
                  children: subtitle
                }
              }] : [])
            ]
          }
        }
      ]
    }
  };
}

/**
 * Generate OG image - returns fallback path for now
 * In a real implementation, this would generate actual images at build time
 */
export async function generateOGImage(
  title: string, 
  subtitle?: string,
  outputPath?: string
): Promise<string> {
  // For now, we return a fallback path
  // The actual image generation happens in the build script
  console.log(`OG image placeholder for: ${outputPath || 'unknown'} (title: ${title})`);
  return outputPath || 'og-image-placeholder';
}

/**
 * Generate OG image for blog post
 */
export async function generatePostOGImage(slug: string, title: string): Promise<string> {
  const outputPath = `og/posts/${slug}.png`;
  await generateOGImage(title, 'notes.kinokonoko.io', outputPath);
  return `/${outputPath}`;
}

/**
 * Generate OG image for category page
 */
export async function generateCategoryOGImage(category: string, categoryLabel: string): Promise<string> {
  const outputPath = `og/categories/${category}.png`;
  await generateOGImage(categoryLabel, 'notes.kinokonoko.io', outputPath);
  return `/${outputPath}`;
}

/**
 * Generate OG image for tag page
 */
export async function generateTagOGImage(tag: string): Promise<string> {
  const outputPath = `og/tags/${tag}.png`;
  const tagTitle = `「${tag}」タグの投稿一覧`;
  await generateOGImage(tagTitle, 'notes.kinokonoko.io', outputPath);
  return `/${outputPath}`;
}

/**
 * Generate OG image for home page
 */
export async function generateHomeOGImage(): Promise<string> {
  const outputPath = 'og/home.png';
  await generateOGImage('notes.kinokonoko.io', '', outputPath);
  return `/${outputPath}`;
}

// Export the template function for the build script
export { createOGTemplate };
