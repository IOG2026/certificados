import { cookies } from "next/headers";
import db from "@/lib/database";
import { assertPreviewDatabase, digest } from "@/lib/auth/core";
import { COOKIE, cookieOptions, json, sameOrigin } from "@/lib/auth/server";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Solicitud no permitida." }, 403);
  try {
    assertPreviewDatabase();
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (token) await db.execute({ sql: "DELETE FROM io_sessions WHERE token_hash=?", args: [digest(token)] });
    jar.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return json({ ok: true });
  } catch { return json({ error: "No se pudo cerrar la sesión. Intenta nuevamente." }, 503); }
}
