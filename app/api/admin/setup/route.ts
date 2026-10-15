import { randomUUID, timingSafeEqual } from "node:crypto";
import db from "@/lib/database";
import { assertPreviewDatabase, digest, hashPassword, normalizeEmail, validEmail, validPassword } from "@/lib/auth/core";
import { authSchema } from "@/lib/auth/schema";
import { json, sameOrigin } from "@/lib/auth/server";

// Alta inicial únicamente con secreto configurado explícitamente en el ambiente.
// No migra nada hasta validar el secreto y la base de Preview.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Solicitud no permitida." }, 403);
  const secret = process.env.IO_VERIFY_SETUP_SECRET;
  if (!secret || secret.length < 32) return json({ error: "La configuración inicial no está habilitada." }, 404);
  try {
    const body = await req.json();
    if (typeof body.secret !== "string" || body.secret.length > 256 || !timingSafeEqual(Buffer.from(digest(body.secret)), Buffer.from(digest(secret)))) return json({ error: "Código de configuración incorrecto." }, 403);
    const email = normalizeEmail(body.email);
    if (!validEmail(email) || !validPassword(body.password)) return json({ error: "Indica un correo válido y una contraseña de 8 a 128 caracteres." }, 400);
    assertPreviewDatabase();
    const hash = await hashPassword(body.password);
    const tx = await db.transaction("write");
    try {
      for (const sql of authSchema) await tx.execute(sql);
      const existing = await tx.execute("SELECT id FROM io_users WHERE role='admin' LIMIT 1");
      if (existing.rows.length) { await tx.rollback(); return json({ error: "El administrador inicial ya fue creado." }, 409); }
      await tx.execute({ sql: "INSERT INTO io_users(id,email,password_hash,role,active,created_at) VALUES(?,?,?,'admin',1,?)", args: [randomUUID(), email, hash, Date.now()] });
      await tx.commit();
    } catch (error) { await tx.rollback(); throw error; } finally { tx.close(); }
    return json({ ok: true });
  } catch { return json({ error: "No se pudo configurar el acceso. Comprueba el ambiente y la base de datos." }, 503); }
}

export async function GET() {
  try {
    assertPreviewDatabase();
    await db.execute("SELECT 1");
    return json({ ok: true, previewDatabaseVerified: process.env.VERCEL_ENV === "preview" });
  } catch { return json({ ok: false, error: "El ambiente no está listo para configurar accesos." }, 503); }
}
