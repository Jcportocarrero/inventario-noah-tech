import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROL_HOME, type Rol } from "@/lib/constants";

export const dynamic = "force-dynamic";

// El middleware ya redirige; esto es el respaldo.
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("perfiles").select("rol, activo").eq("id", user.id).limit(1);
  const perfil = data?.[0];
  if (!perfil || !perfil.activo) redirect("/login?error=sin-acceso");

  redirect(ROL_HOME[perfil.rol as Rol]);
}
