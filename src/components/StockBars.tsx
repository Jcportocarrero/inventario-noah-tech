import { AlertTriangle } from "lucide-react";
import type { StockCategoria } from "@/lib/types";

export default function StockBars({ filas }: { filas: StockCategoria[] }) {
  if (filas.length === 0) {
    return (
      <p className="p-5 text-sm text-slate-500">
        Aún no hay categorías. Ejecuta el script de catálogos o créalas desde el administrador.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {filas.map((f) => {
        const conMinimo = f.stock_minimo > 0;
        const pct = conMinimo ? Math.min(100, Math.round((f.disponibles / f.stock_minimo) * 100)) : 100;
        return (
          <li key={f.categoria_id} className="px-5 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-800">{f.categoria}</span>
              <span className="flex items-center gap-2 text-slate-600">
                {f.stock_bajo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                    <AlertTriangle className="h-3 w-3" /> Stock bajo
                  </span>
                )}
                <span>
                  <strong>{f.disponibles}</strong> disp. / {f.total} total
                  {conMinimo && <span className="text-slate-400"> · mín. {f.stock_minimo}</span>}
                </span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  !conMinimo ? "bg-slate-300" : f.stock_bajo ? "bg-red-400" : "bg-emerald-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
