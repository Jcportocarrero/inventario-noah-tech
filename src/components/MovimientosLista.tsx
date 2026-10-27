import Link from "next/link";
import { TIPO_MOV_LABEL, type TipoMovimiento } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { MovimientoReciente } from "@/lib/types";

export default function MovimientosLista({ filas }: { filas: MovimientoReciente[] }) {
  if (filas.length === 0) {
    return <p className="p-5 text-sm text-slate-500">Todavía no hay movimientos registrados.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {filas.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <div className="min-w-0">
            <Link href={`/productos/${m.producto_id}`} className="font-medium text-brand-600 hover:underline">
              {m.codigo}
            </Link>
            <span className="text-slate-500"> · {m.modelo}</span>
            <p className="text-xs text-slate-400">
              {TIPO_MOV_LABEL[m.tipo as TipoMovimiento] ?? m.tipo} · {m.usuario ?? "—"}
            </p>
          </div>
          <span className="shrink-0 text-xs text-slate-400">{formatDateTime(m.fecha_movimiento)}</span>
        </li>
      ))}
    </ul>
  );
}
