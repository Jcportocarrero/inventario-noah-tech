import type { Estado, Rol } from "./constants";

export interface Perfil {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: Rol;
  activo: boolean;
}

export interface Opcion {
  id: string;
  nombre: string;
}

export interface Proveedor {
  id: string;
  razon_social: string;
}

export interface ProductoFila {
  id: string;
  codigo: string;
  numero_serie: string;
  modelo: string;
  estado: Estado;
  garantia_hasta: string | null;
  created_at: string;
  categorias: { nombre: string } | null;
  marcas: { nombre: string } | null;
  ubicaciones: { nombre: string } | null;
}

export interface KpisRow {
  tiempo_registro_prom_seg: number | null;
  tiempo_busqueda_prom_seg: number | null;
  exactitud_pct: number | null;
  trazabilidad_pct: number | null;
  total_productos: number;
  total_disponibles: number;
  n_registros: number;
  n_busquedas: number;
}

export interface StockCategoria {
  categoria_id: string;
  categoria: string;
  stock_minimo: number;
  total: number;
  disponibles: number;
  stock_bajo: boolean;
}

export interface MovimientoReciente {
  id: string;
  tipo: string;
  fecha_movimiento: string;
  producto_id: string;
  codigo: string;
  modelo: string;
  usuario: string | null;
}

export interface HistorialItem {
  id: string;
  tipo: string;
  fecha_movimiento: string;
  ubicacion_origen: string | null;
  ubicacion_destino: string | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  motivo: string | null;
  usuario: string | null;
}
