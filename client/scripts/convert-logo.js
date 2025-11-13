import fs from "fs";
import path from "path";
import sharp from "sharp";

// Convert client/src/assets/logo.jpg to client/public/logo.png (resized to 512x512)
const root = path.resolve(new URL(import.meta.url).pathname, "..", "..");
const src = path.join(root, "src", "assets", "logo.jpg");
const outDir = path.join(root, "public");
const out = path.join(outDir, "logo.png");

(async () => {
  try {
    if (!fs.existsSync(src)) {
      console.error("Source logo not found:", src);
      process.exit(1);
    }
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    await sharp(src).resize(512, 512, { fit: "inside" }).png().toFile(out);
    console.log("Wrote", out);
  } catch (err) {
    console.error("Failed to convert logo:", err);
    process.exit(1);
  }
})();
