import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import db from "@/lib/database";
import { assertPreviewDatabase, digest, newToken, SESSION_SECONDS } from "./core";

export type AuthUser = { id: string; email: string; role: "admin" | "operator" };
export const COOKIE = "io_verify_session";
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host && ["http:", "https:"].includes(new URL(origin).protocol); } catch { return false; }
}
export async function currentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  assertPreviewDatabase();
  const result = await db.execute({
    sql: `SELECT u.id, u.email, u.role FROM io_sessions s JOIN io_users u ON u.id=s.user_id
          WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`,
    args: [digest(token), Date.now()],
  });
  const row = result.rows[0];
  if (!row || (row.role !== "admin" && row.role !== "operator")) return null;
  return { id: String(row.id), email: String(row.email), role: row.role };
}
export async function requireUser(adminOnly = false) {
  const user = await currentUser();
  if (!user) redirect("/admin");
  if (adminOnly && user.role !== "admin") redirect("/admin/dashboard");
  return user;
}
export async function startSession(userId: string, passwordHash: string) {
  const token = newToken();
  const inserted = await db.execute({ sql: "INSERT INTO io_sessions(token_hash,user_id,expires_at) SELECT ?,id,? FROM io_users WHERE id=? AND password_hash=? AND active=1", args: [digest(token), Date.now() + SESSION_SECONDS * 1000, userId, passwordHash] });
  if (!inserted.rowsAffected) throw new Error("Acceso modificado durante el ingreso.");
  (await cookies()).set(COOKIE, token, { ...cookieOptions, maxAge: SESSION_SECONDS });
}
