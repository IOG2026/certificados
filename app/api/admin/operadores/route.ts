import { randomUUID } from "node:crypto";
import db from "@/lib/database";
import { digest, hashPassword, normalizeEmail, validEmail, validPassword } from "@/lib/auth/core";
import { currentUser, json, sameOrigin } from "@/lib/auth/server";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Solicitud no permitida." }, 403);
  try {
    const user = await currentUser();
    if (!user) return json({ error: "Inicia sesión nuevamente." }, 401);
    if (user.role !== "admin") return json({ error: "Acceso exclusivo del administrador." }, 403);
    const body = await req.json();
    if (body.action === "create") {
      const email = normalizeEmail(body.email);
      if (!validEmail(email) || !validPassword(body.password)) return json({ error: "Indica un correo válido y una contraseña de 8 a 128 caracteres." }, 400);
      const hash = await hashPassword(body.password);
      const inserted = await db.execute({
        sql: "INSERT INTO io_users(id,email,password_hash,role,active,created_at) VALUES(?,?,?,'operator',1,?) ON CONFLICT(email) DO NOTHING",
        args: [randomUUID(), email, hash, Date.now()],
      });
      if (!inserted.rowsAffected) return json({ error: "Ese correo ya tiene una cuenta." }, 409);
    } else if (body.action === "active" || body.action === "password") {
      if (typeof body.id !== "string") return json({ error: "Operador no válido." }, 400);
      const target = await db.execute({ sql: "SELECT email FROM io_users WHERE id=? AND role='operator'", args: [body.id] });
      if (!target.rows.length) return json({ error: "Operador no encontrado." }, 404);
      if (body.action === "active" && typeof body.active !== "boolean") return json({ error: "Estado no válido." }, 400);
      if (body.action === "password" && !validPassword(body.password)) return json({ error: "La contraseña debe tener entre 8 y 128 caracteres." }, 400);
      const change = body.action === "active"
        ? { sql: "UPDATE io_users SET active=? WHERE id=? AND role='operator'", args: [body.active ? 1 : 0, body.id] }
        : { sql: "UPDATE io_users SET password_hash=? WHERE id=? AND role='operator'", args: [await hashPassword(body.password), body.id] };
      await db.batch([
        change,
        { sql: "DELETE FROM io_sessions WHERE user_id=?", args: [body.id] },
        { sql: "DELETE FROM io_login_attempts WHERE key=?", args: [digest(String(target.rows[0].email))] },
      ], "write");
    } else return json({ error: "Acción no válida." }, 400);
    return json({ ok: true });
  } catch { return json({ error: "No se pudo guardar el cambio. Intenta nuevamente." }, 503); }
}
