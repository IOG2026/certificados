"use client";
import Link from "next/link";
import { useState } from "react";
export default function AdminNav({ user }: { user: { email: string; role: string } }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.assign("/admin");
    } catch { setError("No se pudo cerrar la sesión. Intenta nuevamente."); setBusy(false); }
  }
  return <nav aria-label="Administración" style={{ padding: "18px 30px", background: "white", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", color: "#222" }}>
    <Link href="/admin/dashboard"><b>IO Verify</b></Link>
    <Link href="/admin/importar">Importar Excel</Link>
    {user.role === "admin" && <Link href="/admin/operadores">Operadores</Link>}
    <span style={{ marginLeft: "auto", fontSize: 14 }}>{user.email} · {user.role === "admin" ? "Administrador" : "Operador"}</span>
    <button onClick={logout} disabled={busy} style={{ cursor: "pointer", textDecoration: "underline" }}>{busy ? "Cerrando…" : "Cerrar sesión"}</button>
    {error && <p role="alert">{error}</p>}
  </nav>;
}
