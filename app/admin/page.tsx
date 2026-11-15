import { redirect } from "next/navigation";
import { OwnerDashboard } from "@/components/owner-dashboard";
import { isOwnerAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!await isOwnerAuthenticated()) redirect("/owner-login");
  return <OwnerDashboard />;
}
