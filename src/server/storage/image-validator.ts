export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const imageSignatures = {
  "image/jpeg": (buffer: Buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  "image/png": (buffer: Buffer) =>
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
  "image/webp": (buffer: Buffer) =>
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP",
} as const;

export type SupportedImageMimeType = keyof typeof imageSignatures;

const extensions: Record<SupportedImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface ImageFileInput {
  buffer: Buffer;
  mimeType: string;
}

export interface ValidatedImage {
  buffer: Buffer;
  mimeType: SupportedImageMimeType;
  extension: string;
}

export function validateImageFile(input: ImageFileInput): ValidatedImage {
  if (input.buffer.length === 0) {
    throw new TypeError("Image file must not be empty");
  }
  if (input.buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new RangeError(
      `Image file must be no larger than ${MAX_IMAGE_SIZE_BYTES} bytes`,
    );
  }
  const mimeType = Object.keys(imageSignatures).find(
    (candidate): candidate is SupportedImageMimeType =>
      candidate === input.mimeType,
  );
  if (!mimeType) {
    throw new TypeError("Only JPEG, PNG, and WebP images are supported");
  }

  if (!imageSignatures[mimeType](input.buffer)) {
    throw new TypeError("Image content does not match its declared file type");
  }

  return {
    buffer: input.buffer,
    mimeType,
    extension: extensions[mimeType],
  };
}
