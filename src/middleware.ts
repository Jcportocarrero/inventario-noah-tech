import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ROL_HOME, type Rol } from "@/lib/constants";

// Redirige conservando las cookies de sesion que se hayan refrescado
function redirectTo(request: NextRequest, response: NextResponse, path: string) {
  const url = request.nextUrl.clone();
  const [pathname, search] = path.split("?");
  url.pathname = pathname;
  url.search = search ? `?${search}` : "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { supabase, user, getResponse } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const esLogin = path === "/login";

  // Sin sesion: solo se puede ver el login
  if (!user) {
    if (esLogin) return getResponse();
    return redirectTo(request, getResponse(), "/login");
  }

  // Con sesion: se valida el perfil y el rol
  const { data, error } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", user.id)
    .limit(1);

  if (error) {
    return redirectTo(request, getResponse(), "/login?error=servidor");
  }
  const perfil = data?.[0];
  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut();
    return redirectTo(request, getResponse(), "/login?error=sin-acceso");
  }

  const rol = perfil.rol as Rol;
  const home = ROL_HOME[rol];

  if (esLogin || path === "/") return redirectTo(request, getResponse(), home);

  const bloqueado =
    (path.startsWith("/admin") && rol !== "administrador") ||
    (path.startsWith("/operador") && rol !== "operador") ||
    (path.startsWith("/consultor") && rol !== "consultor") ||
    (path.startsWith("/productos/nuevo") && rol === "consultor");

  if (bloqueado) return redirectTo(request, getResponse(), home);

  return getResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
