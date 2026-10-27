"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarMetrica } from "@/lib/metricas";
import { ESTADO_LABEL, type Estado } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Opcion, ProductoFila } from "@/lib/types";
import EstadoBadge from "@/components/EstadoBadge";

const LIMITE = 50;

// Quita caracteres con significado especial en los filtros de PostgREST
function limpiar(texto: string): string {
  return texto.replace(/[%,()*\\:]/g, " ").replace(/\s+/g, " ").trim();
}

export default function ProductosBuscador({
  categorias,
  ubicaciones,
}: {
  categorias: Opcion[];
  ubicaciones: Opcion[];
}) {
  const supabase = useRef(createClient()).current;
  const inicio = useRef<number | null>(null); // cronometro del KPI de busqueda
  const peticion = useRef(0);

  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("");
  const [filas, setFilas] = useState<ProductoFila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = ++peticion.current;
    const t = setTimeout(async () => {
      setCargando(true);
      setError(null);

      let query = supabase
        .from("productos")
        .select(
          "id, codigo, numero_serie, modelo, estado, garantia_hasta, created_at, categorias(nombre), marcas(nombre), ubicaciones(nombre)"
        )
        .order("created_at", { ascending: false })
        .limit(LIMITE);

      const texto = limpiar(q);
      if (texto) {
        query = query.or(
          `codigo.ilike.%${texto}%,numero_serie.ilike.%${texto}%,modelo.ilike.%${texto}%`
        );
      }
      if (categoria) query = query.eq("categoria_id", categoria);
      if (ubicacion) query = query.eq("ubicacion_id", ubicacion);
      if (estado) query = query.eq("estado", estado);
      else query = query.neq("estado", "de_baja");

      const { data, error: err } = await query;
      if (id !== peticion.current) return; // llego una respuesta mas nueva
      if (err) setError("No se pudo cargar la lista de productos.");
      else setFilas((data ?? []) as unknown as ProductoFila[]);
      setCargando(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, categoria, ubicacion, estado, supabase]);

  function arrancarCronometro() {
    if (inicio.current === null) inicio.current = performance.now();
  }

  // Al abrir un producto de los resultados se cierra la medicion de busqueda
  function alAbrirProducto() {
    if (inicio.current !== null) {
      registrarMetrica(supabase, "busqueda", performance.now() - inicio.current);
      inicio.current = null;
    }
  }

  return (
    <div>
      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Buscar por código, número de serie o modelo"
              value={q}
              onChange={(e) => {
                arrancarCronometro();
                setQ(e.target.value);
              }}
              aria-label="Buscar productos"
              autoFocus
            />
          </div>
          <select
            className="input"
            value={categoria}
            onChange={(e) => {
              arrancarCronometro();
              setCategoria(e.target.value);
            }}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            className="input"
            value={ubicacion}
            onChange={(e) => {
              arrancarCronometro();
              setUbicacion(e.target.value);
            }}
            aria-label="Filtrar por ubicación"
          >
            <option value="">Todas las ubicaciones</option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            className="input max-w-[220px]"
            value={estado}
            onChange={(e) => {
              arrancarCronometro();
              setEstado(e.target.value);
            }}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos (sin bajas)</option>
            {(Object.keys(ESTADO_LABEL) as Estado[]).map((s) => (
              <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
            ))}
          </select>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            {cargando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {!cargando && `${filas.length} resultado${filas.length === 1 ? "" : "s"}${filas.length === LIMITE ? ` (máx. ${LIMITE}, afina la búsqueda)` : ""}`}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="card mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">N.° de serie</th>
              <th className="px-4 py-3 font-semibold">Ubicación</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Garantía</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/productos/${p.id}`}
                    onClick={alAbrirProducto}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    {p.codigo}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{p.marcas?.nombre} {p.modelo}</p>
                  <p className="text-xs text-slate-400">{p.categorias?.nombre}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.numero_serie}</td>
                <td className="px-4 py-3 text-slate-600">{p.ubicaciones?.nombre ?? "—"}</td>
                <td className="px-4 py-3"><EstadoBadge estado={p.estado} /></td>
                <td className="px-4 py-3 text-slate-600">{formatDate(p.garantia_hasta)}</td>
              </tr>
            ))}
            {!cargando && filas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No se encontraron productos con esos criterios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
