import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROL_HOME } from "@/lib/constants";
import type { Opcion, Proveedor } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ProductoForm from "./ProductoForm";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const { supabase, perfil, user } = await getSession();
  if (perfil.rol === "consultor") redirect(ROL_HOME[perfil.rol]);

  const [cat, mar, ubi, prov] = await Promise.all([
    supabase.from("categorias").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("marcas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("ubicaciones").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("proveedores").select("id, razon_social").eq("activo", true).order("razon_social"),
  ]);

  const categorias = (cat.data ?? []) as Opcion[];
  const marcas = (mar.data ?? []) as Opcion[];
  const ubicaciones = (ubi.data ?? []) as Opcion[];
  const proveedores = (prov.data ?? []) as Proveedor[];

  const faltanCatalogos = categorias.length === 0 || marcas.length === 0 || ubicaciones.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Registrar producto"
        descripcion="Completa los datos del equipo. Los campos con * son obligatorios."
      />
      {faltanCatalogos ? (
        <div className="card p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Faltan datos base para registrar productos.</p>
          <p className="mt-2">
            Se necesita al menos una categoría, una marca y una ubicación activas. Ejecuta el script
            <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">03_seed_catalogos_ejemplo.sql</code>
            en Supabase o cárgalos desde la administración de catálogos.
          </p>
          <Link href="/productos" className="btn-secondary mt-4">Volver a productos</Link>
        </div>
      ) : (
        <ProductoForm
          userId={user.id}
          categorias={categorias}
          marcas={marcas}
          ubicaciones={ubicaciones}
          proveedores={proveedores}
        />
      )}
    </div>
  );
}
