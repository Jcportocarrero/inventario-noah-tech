import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

// Obtiene el usuario y su perfil en Server Components. El middleware ya filtra,
// esto es la segunda barrera y entrega los datos al componente.
export async function getSession() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, correo, rol, activo")
    .eq("id", user.id)
    .limit(1);

  const perfil = data?.[0];
  if (!perfil || !perfil.activo) redirect("/login?error=sin-acceso");

  return { supabase, user, perfil: perfil as Perfil };
}
