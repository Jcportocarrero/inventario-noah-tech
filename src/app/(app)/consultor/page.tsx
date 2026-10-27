import Link from "next/link";
import { Search } from "lucide-react";
import { getSession } from "@/lib/auth";
import type { KpisRow, StockCategoria } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import StockBars from "@/components/StockBars";

export const dynamic = "force-dynamic";

export default async function ConsultorPage() {
  const { supabase, perfil } = await getSession();

  const [kpisRes, stockRes] = await Promise.all([
    supabase.from("v_kpis").select("total_productos, total_disponibles").maybeSingle(),
    supabase.from("v_stock_por_categoria").select("*").order("categoria"),
  ]);
  const kpis = kpisRes.data as Pick<KpisRow, "total_productos" | "total_disponibles"> | null;
  const stock = (stockRes.data ?? []) as StockCategoria[];

  return (
    <div>
      <PageHeader
        titulo={`Hola, ${perfil.nombre_completo.split(" ")[0]}`}
        descripcion="Consulta la disponibilidad de productos y revisa su historial. Acceso de solo lectura."
        acciones={
          <Link href="/productos" className="btn-primary">
            <Search className="h-4 w-4" /> Buscar producto
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:max-w-xl">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">Productos activos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{kpis?.total_productos ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">Disponibles ahora</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{kpis?.total_disponibles ?? 0}</p>
        </div>
      </section>

      <div className="card mt-8">
        <h2 className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-slate-900">
          Disponibilidad por categoría
        </h2>
        <StockBars filas={stock} />
      </div>
    </div>
  );
}
