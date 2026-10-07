export const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function hasValidImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  }
  if (mime === "image/gif") {
    const header = new TextDecoder().decode(bytes.slice(0, 6));
    return header === "GIF89a" || header === "GIF87a";
  }
  if (mime === "image/webp") {
    return bytes.length >= 12 &&
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}


export async function sanitizeImage(bytes: Uint8Array, mime: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const input = Buffer.from(bytes);
  const image = sharp(input, { animated: mime === "image/gif" || mime === "image/webp" });
  switch (mime) {
    case "image/jpeg":
      return image.rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    case "image/png":
      return image.rotate().png({ compressionLevel: 9 }).toBuffer();
    case "image/gif":
      return image.rotate().gif().toBuffer();
    case "image/webp":
      return image.rotate().webp({ quality: 92 }).toBuffer();
    default:
      throw new Error("Unsupported image type");
  }
}
