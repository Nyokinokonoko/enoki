import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Create SVG template for OG image with basic fallback styling
 */
function createOGTemplate(title: string, subtitle?: string) {
  const hasSubtitle = subtitle && subtitle.trim().length > 0;    return {
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
      children: [// Gradient border
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
              display: 'flex',
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
        },        // Content container
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
            },            children: [
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
              }
            ].concat(hasSubtitle ? [{
                type: 'div',
                props: {
                  style: {
                    fontSize: '36px',
                    fontWeight: 400,
                    color: '#4b5563',
                    fontFamily: "'Noto Sans JP', Arial, sans-serif",
                    lineHeight: 1.1,
                    marginBottom: '0',
                    wordBreak: 'break-word',
                  },
                  children: subtitle
                }
              }] : [])
          }
        }
      ]
    }
  };
}

/**
 * Generate OG image with actual SVG-to-PNG conversion
 */
export async function generateOGImage(
  title: string, 
  subtitle?: string,
  outputPath?: string
): Promise<string> {
  if (!outputPath) {
    throw new Error('Output path is required for OG image generation');
  }

  try {
    // Create the SVG template
    const template = createOGTemplate(title, subtitle);    // Generate SVG using satori
    const [regularFont, boldFont] = await Promise.all([
      getFontData(400),
      getFontData(700)
    ]);

    const fonts = [];
    
    // Only add fonts if they have valid data
    if (regularFont.byteLength > 0) {
      fonts.push({
        name: 'Noto Sans JP',
        data: regularFont,
        weight: 400 as const,
        style: 'normal' as const,
      });
    }
    
    if (boldFont.byteLength > 0) {
      fonts.push({
        name: 'Noto Sans JP',
        data: boldFont,
        weight: 700 as const,
        style: 'normal' as const,
      });
    }

    const svg = await satori(template, {
      width: 1200,
      height: 630,
      fonts,
    });

    // Convert SVG to PNG using resvg
    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();    // Ensure output directory exists
    const fullOutputPath = path.join('dist', outputPath);
    const outputDir = path.dirname(fullOutputPath);
    
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // Write the PNG file
    await writeFile(fullOutputPath, pngBuffer);
    
    console.log(`Generated OG image: ${fullOutputPath}`);
    return `/${outputPath}`;
  } catch (error) {
    console.error(`Failed to generate OG image for ${outputPath}:`, error);
    // Return a fallback path if generation fails
    return '/og-article.jpg';
  }
}

/**
 * Get font data from base64 encoded files
 */
async function getFontData(weight: 400 | 700): Promise<ArrayBuffer> {
  try {
    const fontFileName = weight === 700 ? 'NotoSansJP-Bold.txt' : 'NotoSansJP-Regular.txt';
    const fontPath = path.join(process.cwd(), 'tools', 'base64_fonts', fontFileName);
    
    const base64Data = await readFile(fontPath, 'utf-8');
    // Remove any whitespace, newlines, and non-base64 characters
    const cleanBase64 = base64Data.replace(/[^A-Za-z0-9+/=]/g, '');
    
    // Validate base64 string
    if (!cleanBase64 || cleanBase64.length === 0) {
      console.error(`Invalid base64 data for font (weight: ${weight})`);
      return new ArrayBuffer(0);
    }
    
    // Convert base64 to ArrayBuffer using Buffer (Node.js environment)
    const buffer = Buffer.from(cleanBase64, 'base64');
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch (error) {
    console.error(`Failed to load font (weight: ${weight}):`, error);
    // Return empty buffer as fallback
    return new ArrayBuffer(0);
  }
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
