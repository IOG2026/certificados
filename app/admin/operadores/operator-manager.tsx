"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Operator = { id: string; email: string; active: boolean };
export default function OperatorManager({ operators }: { operators: Operator[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState<Operator | null>(null);
  async function save(body: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/operadores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.status === 401) { window.location.assign("/admin"); return false; }
      if (!response.ok) { setMessage(data.error || "No se pudo guardar."); return false; }
      setMessage("Cambio guardado correctamente."); router.refresh(); return true;
    } catch { setMessage("No fue posible conectar con el servidor."); return false; } finally { setBusy(false); }
  }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    if (await save({ action: "create", email: data.get("email"), password: data.get("password") })) form.reset();
  }
  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (await save({ action: "password", id: reset?.id, password: data.get("password") })) setReset(null);
  }
  return <>
    <p>Los operadores pueden importar certificados. Solo tú administras sus accesos.</p>
    {message && <p className="message" role="status">{message}</p>}
    <h2>Crear operador</h2><form onSubmit={create}>
      <label htmlFor="new-email">Correo electrónico</label><input name="email" id="new-email" type="email" maxLength={254} autoComplete="off" required />
      <label htmlFor="new-password">Contraseña inicial</label><input name="password" id="new-password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required />
      <p style={{ fontSize: 14 }}>Mínimo 8 caracteres. Entrega la contraseña al operador por un canal privado.</p>
      <button disabled={busy}>Crear operador</button>
    </form>
    <h2>Cuentas de operadores</h2>
    {!operators.length ? <p>Todavía no hay operadores.</p> : <div style={{ overflowX: "auto" }}><table><thead><tr><th>Correo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {operators.map(op => <tr key={op.id}><td>{op.email}</td><td>{op.active ? "Activo" : "Inactivo"}</td><td>
        <button className="secondary" disabled={busy} onClick={() => save({ action: "active", id: op.id, active: !op.active })}>{op.active ? "Desactivar" : "Reactivar"}</button>
        <button className="secondary" disabled={busy} onClick={() => setReset(op)}>Cambiar contraseña</button>
      </td></tr>)}
    </tbody></table></div>}
    {reset && <form onSubmit={changePassword}><h2>Cambiar contraseña de {reset.email}</h2>
      <label htmlFor="reset-password">Nueva contraseña</label><input id="reset-password" name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required />
      <p>Al guardar, se cerrarán las sesiones abiertas de este operador.</p><div className="actions"><button disabled={busy}>Guardar contraseña</button><button className="secondary" type="button" onClick={() => setReset(null)}>Cancelar</button></div>
    </form>}
  </>;
}
