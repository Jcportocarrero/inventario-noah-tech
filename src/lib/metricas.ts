import type { SupabaseClient } from "@supabase/supabase-js";

// Registra el tiempo medido en el navegador (KPIs de tiempo de registro y busqueda).
// Nunca debe bloquear ni romper la operacion principal.
export function registrarMetrica(
  supabase: SupabaseClient,
  tipo: "registro" | "busqueda",
  duracionMs: number
): void {
  if (!Number.isFinite(duracionMs) || duracionMs < 0) return;
  void supabase
    .from("metricas_uso")
    .insert({ tipo, duracion_ms: Math.round(duracionMs) })
    .then(() => undefined);
}
