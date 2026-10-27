"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ERRORES_URL: Record<string, string> = {
  "sin-acceso": "Tu usuario no tiene acceso al sistema o está inactivo. Contacta al administrador.",
  servidor: "No se pudo verificar tu perfil. Intenta de nuevo en unos minutos.",
};

function traducirError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Tu correo aún no está confirmado. Contacta al administrador.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera unos minutos e inténtalo otra vez.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sin conexión con el servidor. Revisa tu internet.";
  return "No se pudo iniciar sesión. Inténtalo de nuevo.";
}

export default function LoginForm({ errorInicial }: { errorInicial?: string }) {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(
    errorInicial ? ERRORES_URL[errorInicial] ?? null : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!correo.trim() || !clave) {
      setError("Ingresa tu correo y tu contraseña.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password: clave,
    });

    if (authError) {
      setError(traducirError(authError.message));
      setCargando(false);
      return;
    }

    // El middleware redirige al inicio que corresponde al rol (o cierra la sesion si no tiene acceso)
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="correo" className="label">
          Correo
        </label>
        <input
          id="correo"
          type="email"
          autoComplete="username"
          className="input"
          placeholder="nombre@empresa.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          disabled={cargando}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="clave" className="label">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="clave"
            type={ver ? "text" : "password"}
            autoComplete="current-password"
            className="input pr-10"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            disabled={cargando}
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full" disabled={cargando}>
        {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
        {cargando ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-center text-xs text-slate-500">
        ¿Olvidaste tu contraseña? Solicita un restablecimiento al administrador.
      </p>
    </form>
  );
}
