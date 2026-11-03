import Link from "next/link";
import { PackagePlus, Search } from "lucide-react";
import { getSession } from "@/lib/auth";
import { KPIS } from "@/lib/kpis";
import type { KpisRow, MovimientoReciente, StockCategoria } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import StockBars from "@/components/StockBars";
import MovimientosLista from "@/components/MovimientosLista";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, perfil } = await getSession();

  const [kpisRes, stockRes, movRes] = await Promise.all([
    supabase.from("v_kpis").select("*").maybeSingle(),
    supabase.from("v_stock_por_categoria").select("*").order("categoria"),
    supabase.rpc("ultimos_movimientos", { p_limit: 8 }),
  ]);

  const kpis = (kpisRes.data ?? null) as KpisRow | null;
  const stock = (stockRes.data ?? []) as StockCategoria[];
  const movimientos = (movRes.data ?? []) as MovimientoReciente[];
  const stockBajo = stock.filter((s) => s.stock_bajo).length;

  const valores: Record<string, number | null> = {
    tiempo_registro: kpis?.tiempo_registro_prom_seg ?? null,
    tiempo_busqueda: kpis?.tiempo_busqueda_prom_seg ?? null,
    exactitud: kpis?.exactitud_pct ?? null,
    errores: null,
    trazabilidad: kpis?.trazabilidad_pct ?? null,
  };
  const detalles: Record<string, string | undefined> = {
    tiempo_registro: kpis ? `${kpis.n_registros} altas medidas` : undefined,
    tiempo_busqueda: kpis ? `${kpis.n_busquedas} búsquedas medidas` : undefined,
  };

  return (
    <div>
      <PageHeader
        titulo={`Hola, ${perfil.nombre_completo.split(" ")[0]}`}
        descripcion="Indicadores del proyecto frente a la línea base y las metas."
        acciones={
          <>
            <Link href="/productos" className="btn-secondary">
              <Search className="h-4 w-4" /> Buscar
            </Link>
            <Link href="/productos/nuevo" className="btn-primary">
              <PackagePlus className="h-4 w-4" /> Registrar producto
            </Link>
          </>
        }
      />

      {(kpisRes.error || stockRes.error) && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No se pudieron cargar algunos indicadores. Verifica que ejecutaste los scripts SQL 01 y 02
          en Supabase.
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ResumenCard titulo="Productos activos" valor={kpis?.total_productos ?? 0} />
        <ResumenCard titulo="Disponibles" valor={kpis?.total_disponibles ?? 0} />
        <ResumenCard titulo="Categorías con stock bajo" valor={stockBajo} alerta={stockBajo > 0} />
        <ResumenCard titulo="Mediciones de tiempo" valor={(kpis?.n_registros ?? 0) + (kpis?.n_busquedas ?? 0)} />
      </section>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">KPIs del proyecto</h2>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {KPIS.map((def) => (
          <KpiCard key={def.key} def={def} valor={valores[def.key]} detalle={detalles[def.key]} />
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-slate-900">
            Stock por categoría
          </h2>
          <StockBars filas={stock} />
        </div>
        <div className="card">
          <h2 className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-slate-900">
            Últimos movimientos
          </h2>
          <MovimientosLista filas={movimientos} />
        </div>
      </section>
    </div>
  );
}

function ResumenCard({ titulo, valor, alerta }: { titulo: string; valor: number; alerta?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-500">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold ${alerta ? "text-red-600" : "text-slate-900"}`}>{valor}</p>
    </div>
  );
}
