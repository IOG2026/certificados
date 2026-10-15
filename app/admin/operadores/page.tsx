import db from "@/lib/database";
import { requireUser } from "@/lib/auth/server";
import AdminNav from "../ui/admin-nav";
import OperatorManager from "./operator-manager";
export default async function Page() {
  const user = await requireUser(true);
  const result = await db.execute("SELECT id,email,active FROM io_users WHERE role='operator' ORDER BY email");
  const operators = result.rows.map(row => ({ id: String(row.id), email: String(row.email), active: Number(row.active) === 1 }));
  return <><AdminNav user={user} /><main className="io-admin"><section className="card"><h1>Operadores</h1><OperatorManager operators={operators} /></section></main></>;
}
