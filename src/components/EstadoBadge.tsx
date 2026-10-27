import { ESTADO_LABEL, type Estado } from "@/lib/constants";

const COLORES: Record<Estado, string> = {
  disponible: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  asignado: "bg-blue-50 text-blue-700 ring-blue-200",
  en_reparacion: "bg-amber-50 text-amber-700 ring-amber-200",
  de_baja: "bg-slate-100 text-slate-600 ring-slate-300",
};

export default function EstadoBadge({ estado }: { estado: Estado }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORES[estado]}`}
    >
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
}
