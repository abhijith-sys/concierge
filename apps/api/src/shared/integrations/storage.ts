import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "../../config/env.js";
import { ApiError } from "../errors/index.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_BYTES = 5 * 1024 * 1024;

export interface StoredObject {
  url: string;
  key: string;
  mime: string;
  bytes: number;
  visibility: "public" | "private";
}

export interface StoragePort {
  save(input: {
    buffer: Buffer;
    mime: string;
    originalName: string;
    visibility: "public" | "private";
  }): Promise<StoredObject>;
}

function extForMime(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "application/pdf") return ".pdf";
  return "";
}

export class LocalStorageAdapter implements StoragePort {
  constructor(private root = process.env.UPLOAD_ROOT ?? path.resolve("uploads")) {}

  async save(input: {
    buffer: Buffer;
    mime: string;
    originalName: string;
    visibility: "public" | "private";
  }): Promise<StoredObject> {
    if (!ALLOWED_MIME.has(input.mime)) {
      throw new ApiError(400, "INVALID_FILE_TYPE", "Unsupported file type");
    }
    if (input.buffer.byteLength > MAX_BYTES) {
      throw new ApiError(400, "FILE_TOO_LARGE", "File exceeds 5MB limit");
    }
    const folder = input.visibility === "private" ? "private" : "public";
    const key = `${folder}/${randomUUID()}${extForMime(input.mime)}`;
    const full = path.join(this.root, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, input.buffer);
    const url =
      input.visibility === "public"
        ? `/uploads/${key.replace(/^public\//, "public/")}`
        : `/api/uploads/private/${path.basename(key)}`;
    return {
      url: input.visibility === "public" ? `/uploads/public/${path.basename(key)}` : url,
      key,
      mime: input.mime,
      bytes: input.buffer.byteLength,
      visibility: input.visibility,
    };
  }
}

export const storage: StoragePort = new LocalStorageAdapter();

export function hashOtp(code: string) {
  return createHash("sha256").update(`${getEnv().JWT_SECRET}:${code}`).digest("hex");
}

export function generateOtpCode() {
  return String(randomBytes(3).readUIntBE(0, 3) % 1_000_000).padStart(6, "0");
}

export { ALLOWED_MIME, MAX_BYTES };
