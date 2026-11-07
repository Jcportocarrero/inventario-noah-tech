import { getSession } from "@/lib/auth";
import { ROL_LABEL } from "@/lib/constants";
import PageHeader from "@/components/PageHeader";
import CambiarClaveForm from "./CambiarClaveForm";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const { perfil } = await getSession();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader titulo="Mi cuenta" descripcion="Tus datos y la seguridad de tu acceso." />

      <section className="card p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Nombre</dt>
            <dd className="mt-0.5 text-sm text-slate-800">{perfil.nombre_completo}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Rol</dt>
            <dd className="mt-0.5 text-sm text-slate-800">{ROL_LABEL[perfil.rol]}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Correo</dt>
            <dd className="mt-0.5 text-sm text-slate-800">{perfil.correo}</dd>
          </div>
        </dl>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-base font-semibold text-slate-900">Cambiar contraseña</h2>
        <CambiarClaveForm correo={perfil.correo} />
      </section>
    </div>
  );
}
