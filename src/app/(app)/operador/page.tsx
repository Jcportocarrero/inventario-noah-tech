import Link from "next/link";
import { PackagePlus, Search } from "lucide-react";
import { getSession } from "@/lib/auth";
import { inicioDiaLimaISO, formatDateTime } from "@/lib/format";
import type { ProductoFila, StockCategoria } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import EstadoBadge from "@/components/EstadoBadge";
import StockBars from "@/components/StockBars";

export const dynamic = "force-dynamic";

export default async function OperadorPage() {
  const { supabase, perfil, user } = await getSession();

  const [totalRes, hoyRes, recientesRes, stockRes] = await Promise.all([
    supabase.from("productos").select("id", { count: "exact", head: true }).eq("registrado_por", user.id),
    supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("registrado_por", user.id)
      .gte("created_at", inicioDiaLimaISO()),
    supabase
      .from("productos")
      .select("id, codigo, numero_serie, modelo, estado, garantia_hasta, created_at, categorias(nombre), marcas(nombre), ubicaciones(nombre)")
      .eq("registrado_por", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("v_stock_por_categoria").select("*").eq("stock_bajo", true).order("categoria"),
  ]);

  const recientes = (recientesRes.data ?? []) as unknown as ProductoFila[];
  const stockBajo = (stockRes.data ?? []) as StockCategoria[];

  return (
    <div>
      <PageHeader
        titulo={`Hola, ${perfil.nombre_completo.split(" ")[0]}`}
        descripcion="Registra equipos nuevos y ubica cualquier producto en segundos."
        acciones={
          <>
            <Link href="/productos" className="btn-secondary">
              <Search className="h-4 w-4" /> Buscar producto
            </Link>
            <Link href="/productos/nuevo" className="btn-primary">
              <PackagePlus className="h-4 w-4" /> Registrar producto
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:max-w-xl">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">Registrados por ti hoy</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{hoyRes.count ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">Registrados por ti en total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalRes.count ?? 0}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-slate-900">
            Tus últimos registros
          </h2>
          {recientes.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Aún no has registrado productos.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recientes.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <Link href={`/productos/${p.id}`} className="font-medium text-brand-600 hover:underline">
                      {p.codigo}
                    </Link>
                    <span className="text-slate-500"> · {p.modelo}</span>
                    <p className="text-xs text-slate-400">
                      {p.ubicaciones?.nombre ?? "—"} · {formatDateTime(p.created_at)}
                    </p>
                  </div>
                  <EstadoBadge estado={p.estado} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-slate-900">
            Categorías con stock bajo
          </h2>
          {stockBajo.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Ninguna categoría está por debajo del mínimo.</p>
          ) : (
            <StockBars filas={stockBajo} />
          )}
        </div>
      </section>
    </div>
  );
}
