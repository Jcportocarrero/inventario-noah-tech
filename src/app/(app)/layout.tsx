import { getSession } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { perfil } = await getSession();
  return <AppShell perfil={perfil}>{children}</AppShell>;
}
