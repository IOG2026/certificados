"use client";
import { useState } from "react";
export default function Setup() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await response.json();
      if (!response.ok) { setError(result.error); setBusy(false); return; }
      window.location.assign("/admin");
    } catch { setError("No fue posible conectar."); setBusy(false); }
  }
  return <main className="io-admin"><section className="card login"><h1>Activar administrador</h1>
    <p>Configuración inicial de IO Verify. Se utiliza una sola vez.</p>
    <form onSubmit={submit}>
      <label htmlFor="secret">Código de configuración</label><input id="secret" name="secret" type="password" autoComplete="off" required minLength={32} maxLength={256} />
      <label htmlFor="email">Correo del administrador</label><input id="email" name="email" type="email" autoComplete="username" maxLength={254} required />
      <label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      {error && <p role="alert">{error}</p>}<button disabled={busy}>{busy ? "Activando…" : "Crear administrador"}</button>
    </form>
  </section></main>;
}
