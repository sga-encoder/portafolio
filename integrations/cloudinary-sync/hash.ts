import { createHash } from "node:crypto";

export function sha1Hex(buffer: Buffer): string {
  return `sha1:${createHash("sha1").update(buffer).digest("hex")}`;
}
