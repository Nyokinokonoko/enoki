import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { Resvg } from "@resvg/resvg-js";

/**
 * Create a simple SVG for OG images with left-aligned text and text wrapping
 */
function createSimpleSVG(title, subtitle) {
  const hasSubtitle = subtitle && subtitle.trim().length > 0;
  // Calculate safe text area: content area width (1168) minus left margin (60-16=44) minus right margin (60)
  // This ensures text stays well within the white content area
  const maxWidth = 1168 - 44 - 60; // = 1064, then make it more conservative
  const safeMaxWidth = Math.floor(maxWidth * 0.85); // 85% for extra safety = ~904px
  // Wrap long titles with bigger, bold text
  const wrappedLines = wrapText(title, safeMaxWidth, hasSubtitle ? 38 : 42);
  const lineHeight = hasSubtitle ? 50 : 55;
  const startY = hasSubtitle ? 120 : 160;

  let titleElements = "";
  wrappedLines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    titleElements += `
    <text x="60" y="${y}" 
          font-family="'Noto Sans JP', Arial, sans-serif" 
          font-size="${hasSubtitle ? 38 : 42}" 
          font-weight="700" 
          fill="#111827" 
          text-anchor="start" 
          dominant-baseline="hanging">
      ${escapeXml(line)}
    </text>`;
  });

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="border" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#d4a700;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#b8860b;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Gradient border background (full image) -->
    <rect width="1200" height="630" fill="url(#border)"/>
    
    <!-- White content area with thicker border -->
    <rect x="16" y="16" width="1168" height="598" rx="12" fill="white"/>
    
    <!-- Title (possibly multi-line) -->
    ${titleElements}
    
    ${
      hasSubtitle
        ? `
    <!-- Subtitle -->
    <text x="60" y="${startY + wrappedLines.length * lineHeight + 30}" 
          font-family="'Noto Sans JP', Arial, sans-serif" 
          font-size="28" 
          font-weight="400" 
          fill="#4b5563" 
          text-anchor="start" 
          dominant-baseline="hanging">
      ${escapeXml(subtitle)}
    </text>
    `
        : ""
    }
  </svg>`;
}

/**
 * Wrap text to fit within specified width with intelligent word boundary detection
 *
 * Text wrapping occurs when:
 * 1. Character count per line would exceed maxCharsPerLine (calculated from maxWidth and fontSize)
 * 2. English words/phrases are automatically detected and kept together
 * 3. Japanese characters can break anywhere (appropriate for Japanese typography)
 * 4. Punctuation within English phrases is preserved (e.g., "OAuth 2.0", "API-Key")
 * 5. Spaces at line beginnings are automatically trimmed
 *
 * Algorithm:
 * - Smart tokenization that dynamically identifies English words and Japanese characters
 * - English words (including numbers, periods, hyphens) are kept as complete units
 * - Japanese characters are treated as individual breakable units
 * - Builds lines character by character, respecting language-specific break rules
 * - Falls back to character-level breaking only for tokens longer than maxCharsPerLine
 * - Limits output to maximum 3 lines to prevent overflow
 *
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width in pixels for each line
 * @param {number} fontSize - Font size used for character width calculation
 * @returns {string[]} Array of wrapped text lines (max 3 lines)
 */
function wrapText(text, maxWidth, fontSize) {
  // Less conservative character width estimation to better utilize space
  const avgCharWidth = fontSize * 0.65; // Slightly less conservative for better space usage
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

  const lines = [];
  let currentLine = "";

  /**
   * Check if a character is Japanese (Hiragana, Katakana, Kanji)
   */
  function isJapanese(char) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(char);
  }

  /**
   * Check if a character is an English letter, number, or common punctuation
   */
  function isEnglishWordChar(char) {
    return /[a-zA-Z0-9._-]/.test(char);
  }

  /**
   * Smart tokenization that preserves English words/phrases and allows Japanese character breaks
   */
  function tokenize(text) {
    const tokens = [];
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
      } else {
        // Punctuation or special character
        if (inEnglishWord && isEnglishWordChar(nextChar)) {
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
 * Escape XML characters
 */
function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generate SVG and convert to PNG using resvg
 */
async function generateOGImage(title, subtitle, outputPath) {
  try {
    // Ensure directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Generate SVG
    const svg = createSimpleSVG(title, subtitle);

    // Save SVG for reference
    const svgPath = outputPath.replace(".png", ".svg");
    writeFileSync(svgPath, svg, "utf8");
    console.log(`Generated SVG: ${svgPath}`);

    // Convert SVG to PNG using resvg
    try {
      const resvg = new Resvg(svg);
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      // Save PNG
      writeFileSync(outputPath, pngBuffer);
      console.log(`Generated PNG: ${outputPath}`);
    } catch (resvgError) {
      console.error(
        `Failed to convert to PNG with resvg: ${resvgError.message}`
      );

      // Create a placeholder PNG if resvg fails
      const placeholderPNG = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77ZgAAAABJRU5ErkJggg==",
        "base64"
      );
      writeFileSync(outputPath, placeholderPNG);
      console.log(`Generated placeholder PNG: ${outputPath}`);
    }

    return outputPath;
  } catch (error) {
    console.error(`Failed to generate ${outputPath}:`, error);
    return null;
  }
}

/**
 * Main script
 */
async function main() {
  const publicDir = "public";

  console.log("Generating OG images...");
  console.log("Using SVG generation + resvg for PNG conversion");

  // Generate home page OG image
  await generateOGImage(
    "notes.kinokonoko.io",
    "",
    join(publicDir, "og", "home.png")
  );

  // Generate post OG images using actual Japanese titles
  const posts = [
    {
      slug: "contentful-webhook-ghaction",
      title:
        "Contentful の Webhook を GitHub Action をトリガーして、記事更新したらブログのリビルドを走らせる",
    },
    {
      slug: "ios_unity_screenshot_screenrecord_noti",
      title:
        "Unity アプリで iOS のスクリーンショットと画面録画を検出し通知する",
    },
  ];

  for (const post of posts) {
    await generateOGImage(
      post.title, // Use actual Japanese title
      "notes.kinokonoko.io",
      join(publicDir, "og", "posts", `${post.slug}.png`)
    );
  }

  // Generate category OG images using Japanese labels
  const categories = [
    { id: "dev", label: "開発メモ" },
    { id: "gadget", label: "ガジェット" },
    { id: "thought", label: "たまに思うことがあるですよ" },
    { id: "other", label: "その他" },
  ];

  for (const category of categories) {
    await generateOGImage(
      category.label, // Use Japanese category label
      "notes.kinokonoko.io",
      join(publicDir, "og", "categories", `${category.id}.png`)
    );
  }

  // Generate tag OG images with Japanese format
  const tags = ["contentful", "github action", "ios", "unity"];

  for (const tag of tags) {
    const tagTitle = `「${tag}」タグの投稿一覧`;
    await generateOGImage(
      tagTitle,
      "notes.kinokonoko.io",
      join(publicDir, "og", "tags", `${tag}.png`)
    );
  }

  console.log("\nOG image generation complete!");
  console.log(
    "Generated both SVG (for reference) and PNG (for social media) versions."
  );
  console.log("PNG files should now be properly formatted and viewable.");
  console.log(`- Generated ${posts.length} post images with Japanese titles`);
  console.log(
    `- Generated ${categories.length} category images with Japanese labels`
  );
  console.log(`- Generated ${tags.length} tag images with Japanese format`);
}

main().catch(console.error);
