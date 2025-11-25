import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { v2 as cloudinary } from "cloudinary";

async function run() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  try {
    const publicId = "newsapp/lhnnkcziwc4fcxgwexzh";
    console.log("Checking Cloudinary for", publicId);
    const info = await cloudinary.api.resource(publicId);
    console.log("Cloudinary resource info:", info);
  } catch (err) {
    console.error(
      "Cloudinary API error:",
      err && (err.http_code || err.message)
        ? { http_code: err.http_code, message: err.message }
        : err
    );
  }
}

run();
