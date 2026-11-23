import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

/**
 * SHA-256 of a string's UTF-8 bytes, as lowercase hex.
 *
 * Synchronous and dependency-light on purpose: the renderer runs in the browser (live policy
 * preview), in server actions and in Inngest jobs. `node:crypto` isn't available in the browser
 * and WebCrypto's `subtle.digest` is async, which would make `render()` async everywhere.
 * `@noble/hashes` is audited, pure TypeScript, zero-dependency and does no I/O.
 */
export function sha256Hex(value: string): string {
  return bytesToHex(sha256(utf8ToBytes(value)));
}
