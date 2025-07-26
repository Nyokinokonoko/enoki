import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Wrap text to fit within specified width with intelligent word boundary detection
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  // Less conservative character width estimation to better utilize space
  const avgCharWidth = fontSize * 0.65; // Slightly less conservative for better space usage
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

  const lines: string[] = [];
  let currentLine = "";

  /**
   * Check if a character is Japanese (Hiragana, Katakana, Kanji)
   */
  function isJapanese(char: string): boolean {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(char);
  }

  /**
   * Check if a character is an English letter, number, or common punctuation
   */
  function isEnglishWordChar(char: string): boolean {
    return /[a-zA-Z0-9._-]/.test(char);
  }

  /**
   * Smart tokenization that preserves English words/phrases and allows Japanese character breaks
   */
  function tokenize(text: string): string[] {
    const tokens: string[] = [];
    let currentToken = "";
    let inEnglishWord = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = i + 1 < text.length ? text[i + 1] : null;

      if (char === " ") {
        // Space character - end current token and add space as separate token
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = "";
        }
        tokens.push(char);
        inEnglishWord = false;
      } else if (isJapanese(char)) {
        // Japanese character - can break anywhere
        if (inEnglishWord && currentToken) {
          // Finish the English word first
          tokens.push(currentToken);
          currentToken = "";
        }
        tokens.push(char);
        inEnglishWord = false;
      } else if (isEnglishWordChar(char)) {
        // English word character - keep building the word
        currentToken += char;
        inEnglishWord = true;
      } else {        // Punctuation or special character
        if (inEnglishWord && nextChar && isEnglishWordChar(nextChar)) {
          // Keep punctuation with English words (e.g., "OAuth 2.0", "Single-Sign-On")
          currentToken += char;
        } else {
          // End current token and treat punctuation separately
          if (currentToken) {
            tokens.push(currentToken);
            currentToken = "";
          }
          tokens.push(char);
          inEnglishWord = false;
        }
      }
    }

    // Add any remaining token
    if (currentToken) {
      tokens.push(currentToken);
    }

    return tokens;
  }

  const tokens = tokenize(text);

  // Build lines by fitting tokens
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Skip standalone spaces at the beginning of lines
    if (token === " " && currentLine.trim() === "") {
      continue;
    }

    // Check if adding this token would exceed the line limit
    if (currentLine.length + token.length <= maxCharsPerLine) {
      currentLine += token;
    } else {
      // Save current line if it has content
      if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim());
        currentLine = "";
      }

      // If token itself is too long, break it character by character
      if (token.length > maxCharsPerLine && token !== " ") {
        const chars = token.split("");
        for (let j = 0; j < chars.length; j++) {
          if (currentLine.length + 1 <= maxCharsPerLine) {
            currentLine += chars[j];
          } else {
            if (currentLine.length > 0) {
              lines.push(currentLine);
              currentLine = chars[j];
            }
          }
        }
      } else if (token !== " ") {
        // Token fits on new line
        currentLine = token;
      }
    }
  }

  // Add any remaining content
  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }

  return lines.slice(0, 3); // Limit to 3 lines max
}

/**
 * Create SVG template for OG image with left-aligned text and intelligent text wrapping
 */
function createOGTemplate(title: string, subtitle?: string) {  const hasSubtitle = subtitle && subtitle.trim().length > 0;
  
  // Calculate safe text area: content area width (1168) minus left margin (60-16=44) minus right margin (60)
  // This ensures text stays well within the white content area
  const maxWidth = 1168 - 44 - 60; // = 1064, then make it more conservative
  const safeMaxWidth = Math.floor(maxWidth * 0.85); // 85% for extra safety = ~904px
  
  // Wrap long titles with bigger, bold text
  const titleFontSize = hasSubtitle ? 38 : 42;
  const wrappedLines = wrapText(title, safeMaxWidth, titleFontSize);
  const lineHeight = hasSubtitle ? 50 : 55;
  const startY = hasSubtitle ? 120 : 160;
  
  return {    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        position: 'relative',
        padding: '0px',
        boxSizing: 'border-box',
      },
      children: [
        // Gradient border background (full image)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '0px',
              left: '0px',
              width: '1200px',
              height: '630px',
              background: 'linear-gradient(83.21deg, #d4a700 0%, #b8860b 100%)',
            }
          }
        },
        // White content area with thicker border
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '16px',
              left: '16px',
              width: '1168px',
              height: '598px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
            }
          }        },
        // Content container
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              textAlign: 'left',
              zIndex: 1,
              position: 'relative',
              padding: '60px',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
            },
            children: [
              // Title lines
              ...wrappedLines.map((line, index) => ({
                type: 'div',
                props: {
                  style: {
                    fontSize: `${titleFontSize}px`,
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: `${lineHeight}px`,
                    marginBottom: index === wrappedLines.length - 1 ? (hasSubtitle ? '30px' : '0px') : '0px',
                    fontFamily: "'Noto Sans JP', Arial, sans-serif",
                    position: 'absolute',
                    top: `${startY + index * lineHeight}px`,
                    left: '60px',
                  },
                  children: line
                }
              })),
              // Subtitle
              ...(hasSubtitle ? [{
                type: 'div',
                props: {
                  style: {
                    fontSize: '28px',
                    fontWeight: 400,
                    color: '#4b5563',
                    fontFamily: "'Noto Sans JP', Arial, sans-serif",
                    lineHeight: '34px',
                    position: 'absolute',
                    top: `${startY + wrappedLines.length * lineHeight + 30}px`,
                    left: '60px',
                  },
                  children: subtitle || ''
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
 * Generate OG image and return as data URL for serverless environments
 */
export async function generateOGImage(
  title: string, 
  subtitle?: string
): Promise<string> {
  try {
    // Create the SVG template
    const template = createOGTemplate(title, subtitle);
    
    // Generate SVG using satori
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
    const pngBuffer = pngData.asPng();
    
    // Return as data URL
    const base64 = Buffer.from(pngBuffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error(`Failed to generate OG image:`, error);
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
  return await generateOGImage(title, 'notes.kinokonoko.io');
}

/**
 * Generate OG image for category page
 */
export async function generateCategoryOGImage(category: string, categoryLabel: string): Promise<string> {
  return await generateOGImage(categoryLabel, 'notes.kinokonoko.io');
}

/**
 * Generate OG image for tag page
 */
export async function generateTagOGImage(tag: string): Promise<string> {
  const tagTitle = `「${tag}」タグの投稿一覧`;
  return await generateOGImage(tagTitle, 'notes.kinokonoko.io');
}

/**
 * Generate OG image for home page
 */
export async function generateHomeOGImage(): Promise<string> {
  return await generateOGImage('notes.kinokonoko.io', '');
}

// Export the template function for the build script
export { createOGTemplate };
