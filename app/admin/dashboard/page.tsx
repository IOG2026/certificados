import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import AdminNav from "../ui/admin-nav";
export default async function Dashboard() {
  const user = await requireUser();
  return <><AdminNav user={user} /><main className="io-admin"><section className="card">
    <h1>Panel de administración</h1><p>Gestiona la carga de certificados de IO Group.</p>
    <div className="actions"><Link className="primary" href="/admin/importar">Importar Excel</Link>
    {user.role === "admin" && <Link className="primary" href="/admin/operadores">Administrar operadores</Link>}</div>
  </section></main></>;
}
