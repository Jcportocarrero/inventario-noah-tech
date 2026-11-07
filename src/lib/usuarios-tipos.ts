import type { Rol } from "./constants";

export interface PerfilUsuario {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
}

export interface NuevoUsuario {
  nombre_completo: string;
  correo: string;
  rol: Rol;
  password: string;
}

export interface EdicionUsuario {
  id: string;
  nombre_completo: string;
  rol: Rol;
  activo: boolean;
}

export type Resultado = { ok: true; aviso?: string } | { ok: false; error: string };
