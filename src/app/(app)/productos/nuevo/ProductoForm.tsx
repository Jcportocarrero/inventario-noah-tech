"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarMetrica } from "@/lib/metricas";
import { hoyLima } from "@/lib/format";
import { ESTADO_LABEL, ESTADOS_REGISTRO, type Estado } from "@/lib/constants";
import type { Opcion, Proveedor } from "@/lib/types";

interface Props {
  userId: string;
  categorias: Opcion[];
  marcas: Opcion[];
  ubicaciones: Opcion[];
  proveedores: Proveedor[];
}

interface FormState {
  codigo: string;
  numero_serie: string;
  categoria_id: string;
  marca_id: string;
  proveedor_id: string;
  modelo: string;
  ubicacion_id: string;
  estado: Estado;
  fecha_ingreso: string;
  garantia_hasta: string;
}

type Errores = Partial<Record<keyof FormState, string>>;

const CODIGO_RE = /^[A-Za-z0-9][A-Za-z0-9\-_./]*$/;

function vacio(): FormState {
  return {
    codigo: "",
    numero_serie: "",
    categoria_id: "",
    marca_id: "",
    proveedor_id: "",
    modelo: "",
    ubicacion_id: "",
    estado: "disponible",
    fecha_ingreso: hoyLima(),
    garantia_hasta: "",
  };
}

function validar(f: FormState): Errores {
  const e: Errores = {};
  const codigo = f.codigo.trim();
  const serie = f.numero_serie.trim();
  const modelo = f.modelo.trim();

  if (!codigo) e.codigo = "Ingresa el código del producto.";
  else if (codigo.length > 30) e.codigo = "Máximo 30 caracteres.";
  else if (!CODIGO_RE.test(codigo)) e.codigo = "Solo letras, números y los signos - _ . /";

  if (!serie) e.numero_serie = "Ingresa el número de serie.";
  else if (serie.length > 60) e.numero_serie = "Máximo 60 caracteres.";

  if (!f.categoria_id) e.categoria_id = "Selecciona una categoría.";
  if (!f.marca_id) e.marca_id = "Selecciona una marca.";

  if (!modelo) e.modelo = "Ingresa el modelo.";
  else if (modelo.length > 80) e.modelo = "Máximo 80 caracteres.";

  if (!f.ubicacion_id) e.ubicacion_id = "Selecciona la ubicación.";
  if (!f.fecha_ingreso) e.fecha_ingreso = "Indica la fecha de ingreso.";
  if (f.garantia_hasta && f.fecha_ingreso && f.garantia_hasta < f.fecha_ingreso) {
    e.garantia_hasta = "La garantía no puede vencer antes del ingreso.";
  }
  return e;
}

export default function ProductoForm({ userId, categorias, marcas, ubicaciones, proveedores }: Props) {
  const supabase = useRef(createClient()).current;
  const inicio = useRef<number | null>(null);
  const codigoRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState<FormState>(vacio);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [conservar, setConservar] = useState(true);
  const [ok, setOk] = useState<{ id: string; codigo: string; segundos: number | null } | null>(null);

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setF((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  // El cronometro del KPI arranca cuando el usuario toca el formulario por primera vez
  function marcarInicio() {
    if (inicio.current === null) inicio.current = performance.now();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    setOk(null);

    const errs = validar(f);
    setErrores(errs);
    if (Object.keys(errs).length > 0) return;

    setGuardando(true);
    const { data, error } = await supabase
      .from("productos")
      .insert({
        codigo: f.codigo.trim().toUpperCase(),
        numero_serie: f.numero_serie.trim().toUpperCase(),
        categoria_id: f.categoria_id,
        marca_id: f.marca_id,
        proveedor_id: f.proveedor_id || null,
        modelo: f.modelo.trim(),
        ubicacion_id: f.ubicacion_id,
        estado: f.estado,
        fecha_ingreso: f.fecha_ingreso,
        garantia_hasta: f.garantia_hasta || null,
        registrado_por: userId,
      })
      .select("id")
      .single();
    setGuardando(false);

    if (error) {
      if (error.code === "23505") {
        const msg = error.message;
        if (msg.includes("numero_serie")) {
          setErrores({ numero_serie: "Ya existe un producto con este número de serie." });
        } else if (msg.includes("codigo")) {
          setErrores({ codigo: "Ya existe un producto con este código." });
        } else {
          setErrorGeneral("Ya existe un producto con esos datos.");
        }
      } else if (error.code === "42501") {
        setErrorGeneral("No tienes permiso para registrar productos.");
      } else {
        setErrorGeneral(`No se pudo registrar el producto. ${error.message}`);
      }
      return;
    }

    // Tiempo de registro (KPI): desde la primera interaccion hasta el guardado
    let segundos: number | null = null;
    if (inicio.current !== null) {
      const ms = performance.now() - inicio.current;
      segundos = Math.round(ms / 1000);
      registrarMetrica(supabase, "registro", ms);
      inicio.current = null;
    }

    setOk({ id: data.id, codigo: f.codigo.trim().toUpperCase(), segundos });
    setF((prev) =>
      conservar
        ? { ...prev, codigo: "", numero_serie: "", garantia_hasta: "" }
        : vacio()
    );
    setTimeout(() => codigoRef.current?.focus(), 0);
  }

  const cls = (campo: keyof FormState) => `input ${errores[campo] ? "input-error" : ""}`;

  return (
    <form onSubmit={onSubmit} onFocus={marcarInicio} className="card p-5 sm:p-6" noValidate>
      {ok && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Producto <strong>{ok.codigo}</strong> registrado
            {ok.segundos !== null && <> en {ok.segundos} s</>}.{" "}
            <Link href={`/productos/${ok.id}`} className="font-semibold underline">
              Ver ficha
            </Link>
          </div>
        </div>
      )}
      {errorGeneral && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorGeneral}</span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="codigo" className="label">Código *</label>
          <input
            id="codigo"
            ref={codigoRef}
            className={cls("codigo")}
            value={f.codigo}
            onChange={(e) => set("codigo", e.target.value)}
            placeholder="LAP-001"
            maxLength={30}
            autoFocus
          />
          {errores.codigo && <p className="field-error">{errores.codigo}</p>}
        </div>

        <div>
          <label htmlFor="serie" className="label">Número de serie *</label>
          <input
            id="serie"
            className={cls("numero_serie")}
            value={f.numero_serie}
            onChange={(e) => set("numero_serie", e.target.value)}
            maxLength={60}
          />
          {errores.numero_serie && <p className="field-error">{errores.numero_serie}</p>}
        </div>

        <div>
          <label htmlFor="categoria" className="label">Categoría *</label>
          <select id="categoria" className={cls("categoria_id")} value={f.categoria_id} onChange={(e) => set("categoria_id", e.target.value)}>
            <option value="">Selecciona...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {errores.categoria_id && <p className="field-error">{errores.categoria_id}</p>}
        </div>

        <div>
          <label htmlFor="marca" className="label">Marca *</label>
          <select id="marca" className={cls("marca_id")} value={f.marca_id} onChange={(e) => set("marca_id", e.target.value)}>
            <option value="">Selecciona...</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          {errores.marca_id && <p className="field-error">{errores.marca_id}</p>}
        </div>

        <div>
          <label htmlFor="modelo" className="label">Modelo *</label>
          <input
            id="modelo"
            className={cls("modelo")}
            value={f.modelo}
            onChange={(e) => set("modelo", e.target.value)}
            maxLength={80}
          />
          {errores.modelo && <p className="field-error">{errores.modelo}</p>}
        </div>

        <div>
          <label htmlFor="proveedor" className="label">Proveedor (opcional)</label>
          <select id="proveedor" className="input" value={f.proveedor_id} onChange={(e) => set("proveedor_id", e.target.value)}>
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.razon_social}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ubicacion" className="label">Ubicación física *</label>
          <select id="ubicacion" className={cls("ubicacion_id")} value={f.ubicacion_id} onChange={(e) => set("ubicacion_id", e.target.value)}>
            <option value="">Selecciona...</option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
          {errores.ubicacion_id && <p className="field-error">{errores.ubicacion_id}</p>}
        </div>

        <div>
          <label htmlFor="estado" className="label">Estado *</label>
          <select id="estado" className="input" value={f.estado} onChange={(e) => set("estado", e.target.value as Estado)}>
            {ESTADOS_REGISTRO.map((s) => (
              <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ingreso" className="label">Fecha de ingreso *</label>
          <input id="ingreso" type="date" className={cls("fecha_ingreso")} value={f.fecha_ingreso} onChange={(e) => set("fecha_ingreso", e.target.value)} />
          {errores.fecha_ingreso && <p className="field-error">{errores.fecha_ingreso}</p>}
        </div>

        <div>
          <label htmlFor="garantia" className="label">Garantía hasta (opcional)</label>
          <input id="garantia" type="date" className={cls("garantia_hasta")} value={f.garantia_hasta} onChange={(e) => set("garantia_hasta", e.target.value)} />
          {errores.garantia_hasta && <p className="field-error">{errores.garantia_hasta}</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={conservar}
            onChange={(e) => setConservar(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200"
          />
          Conservar categoría, marca, modelo y ubicación para el siguiente
        </label>
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {guardando ? "Guardando..." : "Registrar producto"}
        </button>
      </div>
    </form>
  );
}
