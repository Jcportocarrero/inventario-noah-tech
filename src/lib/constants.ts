export type Rol = "administrador" | "operador" | "consultor";
export type Estado = "disponible" | "asignado" | "en_reparacion" | "de_baja";
export type TipoMovimiento = "ingreso" | "salida" | "traslado" | "cambio_estado" | "baja";

export const ROL_LABEL: Record<Rol, string> = {
  administrador: "Administrador",
  operador: "Operador de Inventario",
  consultor: "Consultor / Auditor",
};

export const ROL_HOME: Record<Rol, string> = {
  administrador: "/admin",
  operador: "/operador",
  consultor: "/consultor",
};

export const ESTADO_LABEL: Record<Estado, string> = {
  disponible: "Disponible",
  asignado: "Asignado",
  en_reparacion: "En reparación",
  de_baja: "De baja",
};

// Al registrar un producto no se permite "de_baja" (la baja es solo del administrador)
export const ESTADOS_REGISTRO: Estado[] = ["disponible", "asignado", "en_reparacion"];

export const MOTIVO_BAJA_LABEL: Record<string, string> = {
  venta: "Venta",
  obsolescencia: "Obsolescencia",
  dano: "Daño",
  garantia: "Garantía",
};

export const TIPO_MOV_LABEL: Record<TipoMovimiento, string> = {
  ingreso: "Ingreso",
  salida: "Salida",
  traslado: "Traslado",
  cambio_estado: "Cambio de estado",
  baja: "Baja",
};
