// Quick test of the TypeScript OG generator
import { generateOGImage } from "./src/lib/og-generator.ts";

async function test() {
  try {
    console.log("Testing OG image generation...");
    const result = await generateOGImage(
      "Test Title",
      "Test Subtitle",
      "og/test/test-image.png"
    );
    console.log("Generated:", result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
