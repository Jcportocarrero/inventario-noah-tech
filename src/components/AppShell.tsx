"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  PackagePlus,
  Package,
  Users,
  Tags,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROL_LABEL, ROL_HOME, type Rol } from "@/lib/constants";
import type { Perfil } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (p: string) => boolean;
  disabled?: boolean;
}

function navPara(rol: Rol): NavItem[] {
  const inicio: NavItem = {
    href: ROL_HOME[rol],
    label: rol === "administrador" ? "Dashboard" : "Inicio",
    icon: rol === "administrador" ? LayoutDashboard : Home,
    match: (p) => p === ROL_HOME[rol],
  };
  const productos: NavItem = {
    href: "/productos",
    label: "Productos",
    icon: Package,
    match: (p) => p === "/productos" || (p.startsWith("/productos/") && p !== "/productos/nuevo"),
  };
  const nuevo: NavItem = {
    href: "/productos/nuevo",
    label: "Registrar producto",
    icon: PackagePlus,
    match: (p) => p === "/productos/nuevo",
  };

  if (rol === "administrador") {
    return [
      inicio,
      productos,
      nuevo,
      { href: "#", label: "Usuarios (próximamente)", icon: Users, match: () => false, disabled: true },
      { href: "#", label: "Catálogos (próximamente)", icon: Tags, match: () => false, disabled: true },
    ];
  }
  if (rol === "operador") return [inicio, productos, nuevo];
  return [inicio, productos];
}

export default function AppShell({
  perfil,
  children,
}: {
  perfil: Perfil;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const items = navPara(perfil.rol);

  async function cerrarSesion() {
    setSaliendo(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const menu = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map((item) => {
        const Icon = item.icon;
        const activo = item.match(pathname);
        const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition";
        if (item.disabled) {
          return (
            <span key={item.label} className={`${base} cursor-not-allowed text-brand-200/60`}>
              <Icon className="h-4 w-4" /> {item.label}
            </span>
          );
        }
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setAbierto(false)}
            className={`${base} ${
              activo ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const usuario = (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-sm font-semibold text-white">{perfil.nombre_completo}</p>
      <p className="truncate text-xs text-brand-200">{ROL_LABEL[perfil.rol]}</p>
      <button
        onClick={cerrarSesion}
        disabled={saliendo}
        className="mt-3 flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20 disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" /> {saliendo ? "Saliendo..." : "Cerrar sesión"}
      </button>
    </div>
  );

  const marca = (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="rounded-lg bg-white/10 p-2 text-white">
        <Boxes className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-white">NOAH TECH</p>
        <p className="text-xs text-brand-200">Inventario</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-800 lg:flex">
        {marca}
        {menu}
        {usuario}
      </aside>

      {/* Barra superior (movil) */}
      <header className="flex items-center justify-between bg-brand-800 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 text-white">
          <Boxes className="h-5 w-5" />
          <span className="text-sm font-bold">NOAH TECH · Inventario</span>
        </div>
        <button onClick={() => setAbierto(true)} className="text-white" aria-label="Abrir menú">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAbierto(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-brand-800">
            <button
              onClick={() => setAbierto(false)}
              className="absolute right-3 top-3 text-white"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            {marca}
            {menu}
            {usuario}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
