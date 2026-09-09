import { randomBytes } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/jpg"]);
const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

const EXT_MIME_FALLBACK: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export function medicalEvidencePublicPath(fileToken: string): string {
  return `/api/leave/evidence/${fileToken}`;
}

export function generateEvidenceFileToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Validate an uploaded medical evidence file and read it into memory. The
 * bytes are stored directly on the LOARequest row (see
 * LOARequest.medicalEvidenceData) rather than written to disk, since the
 * deployed filesystem is read-only outside of /tmp.
 */
export async function readMedicalEvidenceFile(
  file: File,
): Promise<{ data: Buffer; mimeType: string }> {
  if (!file || file.size <= 0) {
    throw new Error("EMPTY_FILE");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const ext = (file.name.match(/\.[^.]+$/)?.[0] ?? "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error("INVALID_FILE_TYPE");
  }
  const mime = (file.type || "").toLowerCase();
  if (mime && !ALLOWED_TYPES.has(mime)) {
    throw new Error("INVALID_FILE_TYPE");
  }

  const data = Buffer.from(await file.arrayBuffer());
  return { data, mimeType: mime || EXT_MIME_FALLBACK[ext] };
}
