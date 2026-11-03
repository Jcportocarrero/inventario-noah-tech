import { Boxes, ShieldCheck, Search, History } from "lucide-react";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-brand-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/10 p-2">
            <Boxes className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold tracking-wide">NOAH TECH SOLUTIONS</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              Inventario de productos tecnológicos
            </h1>
            <p className="mt-3 max-w-md text-brand-100">
              Un solo lugar para registrar, ubicar y rastrear cada equipo, con acceso según tu rol.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-brand-100">
            <li className="flex items-center gap-3">
              <Search className="h-5 w-5 shrink-0" /> Búsqueda por código, serie, categoría o ubicación
            </li>
            <li className="flex items-center gap-3">
              <History className="h-5 w-5 shrink-0" /> Historial de movimientos con fecha y responsable
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0" /> Permisos por rol y datos protegidos
            </li>
          </ul>
        </div>

        <p className="text-xs text-brand-200">San Juan de Lurigancho · 2026</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-lg bg-brand-700 p-2 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="font-semibold text-brand-800">NOAH TECH SOLUTIONS</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-slate-500">Ingresa con tu correo corporativo.</p>
          <LoginForm errorInicial={searchParams.error} />
        </div>
      </section>
    </main>
  );
}
