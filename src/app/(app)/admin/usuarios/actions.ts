"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EdicionUsuario, NuevoUsuario, Resultado } from "@/lib/usuarios-tipos";
import {
  ROLES_VALIDOS,
  esUuid,
  normalizarNombre,
  validarClave,
  validarCorreo,
  validarNombre,
} from "@/lib/usuarios-validacion";

const SIN_PERMISO: Resultado = { ok: false, error: "No tienes permiso para realizar esta acción." };
const SIN_LLAVE: Resultado = {
  ok: false,
  error: "Falta configurar la variable SUPABASE_SERVICE_ROLE_KEY en el servidor (Vercel > Settings > Environment Variables).",
};

// Toda accion verifica en el servidor que quien llama es un administrador activo.
async function exigirAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", user.id)
    .limit(1);
  const perfil = data?.[0];
  if (!perfil || !perfil.activo || perfil.rol !== "administrador") return null;

  return { supabase, adminId: user.id };
}

function clienteAuth() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function traducirErrorAuth(error: { code?: string; message?: string } | null): string {
  const code = error?.code ?? "";
  const msg = (error?.message ?? "").toLowerCase();
  if (code === "email_exists" || msg.includes("already been registered") || msg.includes("already registered")) {
    return "Ese correo ya está registrado en Supabase Auth. Si no aparece en la lista, falta crear su perfil.";
  }
  if (code === "weak_password" || msg.includes("weak") || msg.includes("password should")) {
    return "La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.";
  }
  if (code === "same_password" || msg.includes("different from the old")) {
    return "La nueva contraseña debe ser distinta a la actual.";
  }
  if (code === "user_not_found" || msg.includes("not found")) {
    return "No se encontró el usuario en Supabase Auth.";
  }
  return "No se pudo completar la operación en Supabase Auth. Inténtalo de nuevo.";
}

export async function crearUsuario(input: NuevoUsuario): Promise<Resultado> {
  const ctx = await exigirAdmin();
  if (!ctx) return SIN_PERMISO;

  const nombre = normalizarNombre(input?.nombre_completo);
  const correo = String(input?.correo ?? "").trim().toLowerCase();
  const rol = input?.rol;
  const password = String(input?.password ?? "");

  const error =
    validarNombre(nombre) ??
    validarCorreo(correo) ??
    (ROLES_VALIDOS.includes(rol) ? null : "Selecciona un rol válido.") ??
    validarClave(password);
  if (error) return { ok: false, error };

  const auth = clienteAuth();
  if (!auth) return SIN_LLAVE;

  const { data: existe } = await ctx.supabase.from("perfiles").select("id").eq("correo", correo).limit(1);
  if (existe && existe.length > 0) return { ok: false, error: "Ya existe un usuario con ese correo." };

  const { data: creado, error: errAuth } = await auth.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  });
  if (errAuth || !creado?.user) return { ok: false, error: traducirErrorAuth(errAuth) };

  // El perfil se guarda con la sesion del administrador (respeta las politicas RLS)
  const { error: errPerfil } = await ctx.supabase
    .from("perfiles")
    .insert({ id: creado.user.id, nombre_completo: nombre, correo, rol, activo: true });

  if (errPerfil) {
    // Reversion: no dejar una cuenta de Auth sin perfil
    await auth.auth.admin.deleteUser(creado.user.id);
    return { ok: false, error: "No se pudo guardar el perfil del usuario. La cuenta no fue creada." };
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function actualizarUsuario(input: EdicionUsuario): Promise<Resultado> {
  const ctx = await exigirAdmin();
  if (!ctx) return SIN_PERMISO;

  if (!esUuid(input?.id)) return { ok: false, error: "Usuario no válido." };
  const nombre = normalizarNombre(input.nombre_completo);
  const rol = input.rol;
  const activo = input.activo === true;

  const error =
    validarNombre(nombre) ?? (ROLES_VALIDOS.includes(rol) ? null : "Selecciona un rol válido.");
  if (error) return { ok: false, error };

  // Evita que el administrador se quite el acceso a si mismo
  if (input.id === ctx.adminId && (rol !== "administrador" || !activo)) {
    return { ok: false, error: "No puedes cambiar tu propio rol ni desactivar tu propia cuenta." };
  }

  const { data: actual } = await ctx.supabase
    .from("perfiles")
    .select("activo")
    .eq("id", input.id)
    .limit(1);
  if (!actual || actual.length === 0) return { ok: false, error: "No se encontró el usuario." };
  const cambioActivo = actual[0].activo !== activo;

  const { data: filas, error: errUpd } = await ctx.supabase
    .from("perfiles")
    .update({ nombre_completo: nombre, rol, activo })
    .eq("id", input.id)
    .select("id");
  if (errUpd || !filas || filas.length === 0) {
    return { ok: false, error: "No se pudo actualizar el usuario." };
  }

  // Defensa adicional: al desactivar tambien se bloquea la cuenta en Auth
  let aviso: string | undefined;
  if (cambioActivo) {
    const auth = clienteAuth();
    if (!auth) {
      aviso = "Usuario actualizado, pero no se pudo bloquear la cuenta en Auth (falta la variable SUPABASE_SERVICE_ROLE_KEY).";
    } else {
      const { error: errBan } = await auth.auth.admin.updateUserById(input.id, {
        ban_duration: activo ? "none" : "876000h",
      });
      if (errBan) aviso = "Usuario actualizado, pero no se pudo cambiar el bloqueo de la cuenta en Auth.";
    }
  }

  revalidatePath("/admin/usuarios");
  return { ok: true, aviso };
}

export async function restablecerClave(input: { id: string; password: string }): Promise<Resultado> {
  const ctx = await exigirAdmin();
  if (!ctx) return SIN_PERMISO;

  if (!esUuid(input?.id)) return { ok: false, error: "Usuario no válido." };
  const password = String(input.password ?? "");
  const error = validarClave(password);
  if (error) return { ok: false, error };

  const auth = clienteAuth();
  if (!auth) return SIN_LLAVE;

  const { data: existe } = await ctx.supabase.from("perfiles").select("id").eq("id", input.id).limit(1);
  if (!existe || existe.length === 0) return { ok: false, error: "No se encontró el usuario." };

  const { error: errAuth } = await auth.auth.admin.updateUserById(input.id, { password });
  if (errAuth) return { ok: false, error: traducirErrorAuth(errAuth) };

  return { ok: true };
}
