import { readFile } from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const dir =
  "C:/Users/elisa/AppData/Local/Temp/claude/c--Users-elisa-diamantes3designs/384d015d-525c-4708-a20c-a99d607dcb26/scratchpad/tsanta_render";

async function upload(color) {
  const buffer = await readFile(`${dir}/front_${color}_trimmed.png`);
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", type: "upload", folder: "products" },
      (error, res) => (error || !res ? reject(error) : resolve(res))
    );
    stream.end(buffer);
  });
  return result.secure_url;
}

const urls = {};
for (const color of ["silver", "white", "black"]) {
  urls[color] = await upload(color);
  console.log(color, urls[color]);
}
