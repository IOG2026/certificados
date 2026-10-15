import db from "@/lib/database";
import { assertPreviewDatabase, digest, normalizeEmail, validEmail, validPassword, verifyPassword } from "@/lib/auth/core";
import { json, sameOrigin, startSession } from "@/lib/auth/server";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Solicitud no permitida." }, 403);
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    if (!validEmail(email) || !validPassword(body.password)) return json({ error: "Correo o contraseña incorrectos." }, 401);
    assertPreviewDatabase();
    const now = Date.now();
    const key = digest(email);
    // Incremento atómico compartido entre instancias; no depende de memoria local.
    const attempt = await db.execute({
      sql: `INSERT INTO io_login_attempts(key,attempts,reset_at) VALUES(?,1,?)
        ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END,
        reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END RETURNING attempts`,
      args: [key, now + 15 * 60 * 1000, now, now],
    });
    if (Number(attempt.rows[0].attempts) > 10) return json({ error: "Demasiados intentos. Intenta nuevamente en 15 minutos." }, 429);
    const result = await db.execute({ sql: "SELECT id,password_hash,active FROM io_users WHERE email=?", args: [email] });
    const user = result.rows[0];
    const dummy = "scrypt$" + "0".repeat(32) + "$" + "0".repeat(128);
    const valid = await verifyPassword(body.password, user ? String(user.password_hash) : dummy);
    if (!user || !valid || Number(user.active) !== 1) return json({ error: "Correo o contraseña incorrectos." }, 401);
    await db.execute({ sql: "DELETE FROM io_login_attempts WHERE key=?", args: [key] });
    await startSession(String(user.id), String(user.password_hash));
    return json({ ok: true });
  } catch {
    return json({ error: "No se pudo iniciar sesión. Contacta al administrador." }, 503);
  }
}
