"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validarClave } from "@/lib/usuarios-validacion";

export default function CambiarClaveForm({ correo }: { correo: string }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!actual) return setError("Ingresa tu contraseña actual.");
    const err = validarClave(nueva);
    if (err) return setError(err);
    if (nueva !== confirmar) return setError("La confirmación no coincide con la nueva contraseña.");
    if (nueva === actual) return setError("La nueva contraseña debe ser distinta a la actual.");

    setGuardando(true);
    const supabase = createClient();

    // Se verifica la contrasena actual antes de permitir el cambio
    const { error: errActual } = await supabase.auth.signInWithPassword({ email: correo, password: actual });
    if (errActual) {
      setGuardando(false);
      return setError("La contraseña actual es incorrecta.");
    }

    const { error: errNueva } = await supabase.auth.updateUser({ password: nueva });
    setGuardando(false);
    if (errNueva) {
      const m = errNueva.message.toLowerCase();
      return setError(
        m.includes("different") || m.includes("same")
          ? "La nueva contraseña debe ser distinta a la actual."
          : m.includes("weak") || m.includes("password should")
          ? "La contraseña es demasiado débil. Usa letras, números y más caracteres."
          : "No se pudo cambiar la contraseña. Inténtalo de nuevo."
      );
    }

    setOk(true);
    setActual("");
    setNueva("");
    setConfirmar("");
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
      {ok && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Tu contraseña se cambió correctamente.
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="p-actual" className="label">Contraseña actual</label>
        <input id="p-actual" type="password" autoComplete="current-password" className="input" value={actual} onChange={(e) => setActual(e.target.value)} disabled={guardando} />
      </div>
      <div>
        <label htmlFor="p-nueva" className="label">Nueva contraseña</label>
        <input id="p-nueva" type="password" autoComplete="new-password" className="input" value={nueva} onChange={(e) => setNueva(e.target.value)} disabled={guardando} />
        <p className="mt-1 text-xs text-slate-400">Mínimo 8 caracteres, con letras y números.</p>
      </div>
      <div>
        <label htmlFor="p-confirmar" className="label">Confirmar nueva contraseña</label>
        <input id="p-confirmar" type="password" autoComplete="new-password" className="input" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} disabled={guardando} />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          Cambiar contraseña
        </button>
      </div>
    </form>
  );
}
