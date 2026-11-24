import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { validateImageFile, type ImageFileInput } from "./image-validator";

const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

const hasCloudinaryConfig = Object.values(cloudinaryConfig).every(Boolean);
const hasPartialCloudinaryConfig = Object.values(cloudinaryConfig).some(Boolean);

if (hasPartialCloudinaryConfig && !hasCloudinaryConfig) {
  throw new Error(
    "Cloudinary configuration is incomplete; set cloud name, API key, and API secret",
  );
}

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    secure: true,
  });
}

export interface StoredImage {
  url: string;
  publicId: string;
  storage: "cloudinary" | "local";
}

function uploadToCloudinary(buffer: Buffer): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "civicpulse/issues",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary returned no upload result"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          storage: "cloudinary",
        });
      },
    );
    stream.end(buffer);
  });
}

async function saveLocally(
  buffer: Buffer,
  extension: string,
): Promise<StoredImage> {
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  const filename = `${randomUUID()}.${extension}`;
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), buffer, {
    flag: "wx",
  });

  return {
    url: `/uploads/${filename}`,
    publicId: filename,
    storage: "local",
  };
}

export async function uploadImage(input: ImageFileInput): Promise<StoredImage> {
  const image = validateImageFile(input);
  return hasCloudinaryConfig
    ? uploadToCloudinary(image.buffer)
    : saveLocally(image.buffer, image.extension);
}
