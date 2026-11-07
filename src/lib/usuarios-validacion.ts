import type { Rol } from "./constants";

export const ROLES_VALIDOS: Rol[] = ["administrador", "operador", "consultor"];

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID_RE.test(valor);
}

export function normalizarNombre(valor: unknown): string {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

export function validarNombre(nombre: string): string | null {
  if (nombre.length < 3) return "Ingresa el nombre completo (mínimo 3 caracteres).";
  if (nombre.length > 100) return "El nombre no puede superar 100 caracteres.";
  return null;
}

export function validarCorreo(correo: string): string | null {
  if (!correo) return "Ingresa el correo.";
  if (correo.length > 120) return "El correo no puede superar 120 caracteres.";
  if (!CORREO_RE.test(correo)) return "El correo no tiene un formato válido.";
  return null;
}

export function validarClave(clave: string): string | null {
  if (clave.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (clave.length > 72) return "La contraseña no puede superar 72 caracteres.";
  if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) {
    return "La contraseña debe incluir letras y números.";
  }
  return null;
}

// Contrasena temporal aleatoria (sin caracteres ambiguos como 0/O o 1/l)
export function generarClave(longitud = 12): string {
  const mayus = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minus = "abcdefghijkmnpqrstuvwxyz";
  const digitos = "23456789";
  const simbolos = "!@#$%*?";
  const todos = mayus + minus + digitos + simbolos;

  const azar = (max: number): number => {
    const limite = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    do {
      globalThis.crypto.getRandomValues(buf);
    } while (buf[0] >= limite);
    return buf[0] % max;
  };
  const elegir = (set: string) => set[azar(set.length)];

  const chars = [elegir(mayus), elegir(minus), elegir(digitos), elegir(simbolos)];
  while (chars.length < longitud) chars.push(elegir(todos));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = azar(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
