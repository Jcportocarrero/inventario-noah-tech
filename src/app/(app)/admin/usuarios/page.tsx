import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROL_HOME } from "@/lib/constants";
import type { PerfilUsuario } from "@/lib/usuarios-tipos";
import PageHeader from "@/components/PageHeader";
import UsuariosTabla from "./UsuariosTabla";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const { supabase, perfil, user } = await getSession();
  if (perfil.rol !== "administrador") redirect(ROL_HOME[perfil.rol]);

  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, correo, rol, activo, created_at")
    .order("created_at", { ascending: true });

  return (
    <div>
      <PageHeader
        titulo="Usuarios"
        descripcion="Crea cuentas, asigna roles y controla quién puede entrar al sistema."
      />
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          No se pudo cargar la lista de usuarios.
        </div>
      )}
      <UsuariosTabla usuarios={(data ?? []) as PerfilUsuario[]} yoId={user.id} />
    </div>
  );
}
