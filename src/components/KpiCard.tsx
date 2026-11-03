import { CheckCircle2, CircleDashed, TrendingUp } from "lucide-react";
import { cumpleMeta, type KpiDef } from "@/lib/kpis";
import { formatDuration } from "@/lib/format";

export default function KpiCard({
  def,
  valor,
  detalle,
}: {
  def: KpiDef;
  valor: number | null;
  detalle?: string;
}) {
  const cumple = def.automatico ? cumpleMeta(def, valor) : null;
  const texto =
    valor === null
      ? "Sin datos"
      : def.unidad === "seg"
      ? formatDuration(valor)
      : `${Number(valor).toFixed(1)} %`;

  const estado =
    cumple === null ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
        <CircleDashed className="h-3.5 w-3.5" />
        {def.automatico ? "Esperando mediciones" : "Medición por muestra"}
      </span>
    ) : cumple ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> Cumple la meta
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
        <TrendingUp className="h-3.5 w-3.5" /> Aún no alcanza la meta
      </span>
    );

  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-slate-500">{def.titulo}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{def.automatico ? texto : "—"}</p>
      <div className="mt-1">{estado}</div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
        <div>
          <dt className="text-slate-400">Línea base</dt>
          <dd className="font-semibold text-slate-700">{def.lineaBaseTxt}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Meta</dt>
          <dd className="font-semibold text-slate-700">{def.metaTxt}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-400">{def.medicion}</p>
      {detalle && <p className="mt-1 text-xs font-medium text-slate-500">{detalle}</p>}
    </div>
  );
}
