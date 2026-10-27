// Linea base y metas tomadas de las Tablas 1 y 2 del informe.
export type KpiKey = "tiempo_registro" | "tiempo_busqueda" | "exactitud" | "errores" | "trazabilidad";

export interface KpiDef {
  key: KpiKey;
  titulo: string;
  unidad: "seg" | "%";
  lineaBase: number;
  meta: number;
  sentido: "menor" | "mayor"; // "menor": cumple si valor <= meta
  lineaBaseTxt: string;
  metaTxt: string;
  medicion: string;
  automatico: boolean;
}

export const KPIS: KpiDef[] = [
  {
    key: "tiempo_registro",
    titulo: "Tiempo de registro de un producto",
    unidad: "seg",
    lineaBase: 180,
    meta: 90,
    sentido: "menor",
    lineaBaseTxt: "3 min",
    metaTxt: "≤ 1 min 30 s (−50 %)",
    medicion: "Desde que se empieza a llenar el formulario hasta guardar el producto",
    automatico: true,
  },
  {
    key: "tiempo_busqueda",
    titulo: "Tiempo de búsqueda de un producto",
    unidad: "seg",
    lineaBase: 120,
    meta: 30,
    sentido: "menor",
    lineaBaseTxt: "2 min",
    metaTxt: "≤ 30 s",
    medicion: "Desde la primera búsqueda hasta abrir el producto encontrado",
    automatico: true,
  },
  {
    key: "exactitud",
    titulo: "Exactitud del inventario",
    unidad: "%",
    lineaBase: 90,
    meta: 95,
    sentido: "mayor",
    lineaBaseTxt: "90 %",
    metaTxt: "≥ 95 %",
    medicion: "Último conteo físico vs. registro del sistema",
    automatico: true,
  },
  {
    key: "errores",
    titulo: "Tasa de errores de registro",
    unidad: "%",
    lineaBase: 5,
    meta: 2,
    sentido: "menor",
    lineaBaseTxt: "5 %",
    metaTxt: "≤ 2 %",
    medicion: "Revisión de una muestra de registros (el sistema bloquea duplicados y campos vacíos)",
    automatico: false,
  },
  {
    key: "trazabilidad",
    titulo: "Trazabilidad completa",
    unidad: "%",
    lineaBase: 96,
    meta: 98,
    sentido: "mayor",
    lineaBaseTxt: "96 %",
    metaTxt: "≥ 98 %",
    medicion: "Productos con serie, ubicación, estado e historial de movimientos",
    automatico: true,
  },
];

export function cumpleMeta(def: KpiDef, valor: number | null): boolean | null {
  if (valor === null || valor === undefined) return null;
  return def.sentido === "menor" ? valor <= def.meta : valor >= def.meta;
}
