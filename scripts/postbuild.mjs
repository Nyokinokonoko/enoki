import { copyFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, "../tools/appendAssetIgnore/.assetsignore");
const dest = path.resolve(__dirname, "../dist/.assetsignore");

try {
  await copyFile(src, dest);
  console.log("✅ .assetsignore copied to dist/");
} catch (err) {
  console.error("❌ Failed to copy .assetsignore:", err);
}
