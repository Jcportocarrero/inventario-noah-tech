import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { MOTIVO_BAJA_LABEL, TIPO_MOV_LABEL, type TipoMovimiento } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import type { HistorialItem } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import EstadoBadge from "@/components/EstadoBadge";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProductoDetallePage({ params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) notFound();
  const { supabase } = await getSession();

  const [prodRes, histRes] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id, codigo, numero_serie, modelo, estado, garantia_hasta, fecha_ingreso, motivo_baja, fecha_baja, created_at, categorias(nombre), marcas(nombre), ubicaciones(nombre), proveedores(razon_social)"
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase.rpc("historial_producto", { p_producto_id: params.id }),
  ]);

  if (!prodRes.data) notFound();
  // Las relaciones llegan como objetos (una fila por FK)
  const p = prodRes.data as unknown as {
    id: string;
    codigo: string;
    numero_serie: string;
    modelo: string;
    estado: "disponible" | "asignado" | "en_reparacion" | "de_baja";
    garantia_hasta: string | null;
    fecha_ingreso: string;
    motivo_baja: string | null;
    fecha_baja: string | null;
    categorias: { nombre: string } | null;
    marcas: { nombre: string } | null;
    ubicaciones: { nombre: string } | null;
    proveedores: { razon_social: string } | null;
  };
  const historial = (histRes.data ?? []) as HistorialItem[];

  const datos: [string, React.ReactNode][] = [
    ["Código", <span key="c" className="font-semibold">{p.codigo}</span>],
    ["Número de serie", <span key="s" className="font-mono text-sm">{p.numero_serie}</span>],
    ["Categoría", p.categorias?.nombre ?? "—"],
    ["Marca", p.marcas?.nombre ?? "—"],
    ["Modelo", p.modelo],
    ["Ubicación", p.ubicaciones?.nombre ?? "—"],
    ["Proveedor", p.proveedores?.razon_social ?? "—"],
    ["Fecha de ingreso", formatDate(p.fecha_ingreso)],
    ["Garantía hasta", formatDate(p.garantia_hasta)],
  ];
  if (p.estado === "de_baja") {
    datos.push(["Motivo de baja", MOTIVO_BAJA_LABEL[p.motivo_baja ?? ""] ?? p.motivo_baja ?? "—"]);
    datos.push(["Fecha de baja", formatDate(p.fecha_baja)]);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Volver a productos
      </Link>
      <PageHeader
        titulo={`${p.marcas?.nombre ?? ""} ${p.modelo}`.trim()}
        descripcion={`Código ${p.codigo}`}
        acciones={<EstadoBadge estado={p.estado} />}
      />

      <section className="card p-5">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {datos.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt>
              <dd className="mt-0.5 text-sm text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card mt-6">
        <h2 className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-slate-900">
          Historial de movimientos
        </h2>
        {historial.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Este producto aún no tiene movimientos.</p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {historial.map((h) => (
              <li key={h.id} className="px-5 py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    {TIPO_MOV_LABEL[h.tipo as TipoMovimiento] ?? h.tipo}
                  </span>
                  <span className="text-xs text-slate-400">{formatDateTime(h.fecha_movimiento)}</span>
                </div>
                <p className="mt-1 text-slate-600">
                  {h.ubicacion_origen && h.ubicacion_destino
                    ? `${h.ubicacion_origen} → ${h.ubicacion_destino}`
                    : h.ubicacion_destino
                    ? `Ubicación: ${h.ubicacion_destino}`
                    : h.ubicacion_origen
                    ? `Desde: ${h.ubicacion_origen}`
                    : null}
                </p>
                <p className="text-xs text-slate-400">
                  {h.motivo ?? ""}
                  {h.motivo ? " · " : ""}Responsable: {h.usuario ?? "—"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
