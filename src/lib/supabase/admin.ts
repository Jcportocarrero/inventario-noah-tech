import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la clave de servicio: SOLO para la API de administracion de Auth
// (crear usuarios, cambiar contrasenas, bloquear cuentas). Nunca se importa desde
// componentes de cliente y la clave nunca lleva el prefijo NEXT_PUBLIC_.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("FALTA_SERVICE_ROLE");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
