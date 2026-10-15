"use client";
import { useState } from "react";
import Link from "next/link";
export default function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "No se pudo iniciar sesión."); setBusy(false); return; }
      window.location.assign("/admin/dashboard");
    } catch { setError("No fue posible conectar. Intenta nuevamente."); setBusy(false); }
  }
  return <main className="io-admin"><section className="card login">
    <h1>Administración IO Verify</h1><p>Ingresa con tu correo y contraseña.</p>
    <form onSubmit={login}>
      <label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
      <label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
      {error && <p role="alert" className="message error">{error}</p>}
      <button disabled={busy} type="submit" style={{ width: "100%" }}>{busy ? "Ingresando…" : "Ingresar"}</button>
    </form><p style={{ fontSize: 14 }}>Si necesitas restablecer tu contraseña, contacta al administrador.</p>
    <Link href="/">Volver al verificador público</Link>
  </section></main>;
}
