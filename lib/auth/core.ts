import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";

export const SESSION_SECONDS = 12 * 60 * 60;
export function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function newToken() { return randomBytes(32).toString("hex"); }
export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
export function validEmail(value: string) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, hash] = encoded.split("$");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? "")) return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(hash, "hex"));
}
export function assertPreviewDatabase() {
  if (process.env.VERCEL_ENV !== "preview") return;
  const host = new URL(process.env.TURSO_DATABASE_URL || "").hostname;
  if (!host.startsWith("ioverify-pruebas-") && host !== "ioverify-pruebas.turso.io") {
    throw new Error("Preview debe utilizar la base ioverify-pruebas.");
  }
}
