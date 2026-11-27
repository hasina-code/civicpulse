import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../utils/errors";
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

function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
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

export async function uploadImage(
  input: ImageFileInput,
  folder = "civicpulse/issues",
): Promise<StoredImage> {
  let image: ReturnType<typeof validateImageFile>;
  try {
    image = validateImageFile(input);
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      throw new AppError(error.message, 400, "INVALID_IMAGE");
    }
    throw error;
  }

  if (!hasCloudinaryConfig) {
    return saveLocally(image.buffer, image.extension);
  }

  try {
    return await uploadToCloudinary(image.buffer, folder);
  } catch (error) {
    const providerMessage = getCloudinaryErrorMessage(error);
    if (/unknown api[_ ]key|invalid api[_ ]key|api[_ ]key.*(?:invalid|reject)/i.test(providerMessage ?? "")) {
      throw new AppError(
        "Cloudinary rejected the configured API key. Check CLOUDINARY_API_KEY.",
        502,
        "INVALID_STORAGE_CONFIGURATION",
      );
    }

    console.error(
      "Cloudinary image upload failed:",
      providerMessage ?? "Unknown provider error",
    );
    throw new AppError(
      "Image storage is unavailable. Check the storage configuration and try again.",
      502,
      "IMAGE_UPLOAD_FAILED",
    );
  }
}

function getCloudinaryErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error !== "object" ||
    error === null ||
    !("error" in error) ||
    typeof error.error !== "object" ||
    error.error === null ||
    !("message" in error.error) ||
    typeof error.error.message !== "string"
  ) {
    return undefined;
  }

  return error.error.message;
}
