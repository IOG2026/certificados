import { requireUser } from "@/lib/auth/server";
import ImportForm from "./import-form";
import AdminNav from "../ui/admin-nav";
export default async function Page() {
 const user = await requireUser();
 return <><AdminNav user={user} /><ImportForm /></>;
}
