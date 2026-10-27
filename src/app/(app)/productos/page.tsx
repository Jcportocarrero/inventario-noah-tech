import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { getSession } from "@/lib/auth";
import type { Opcion } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import ProductosBuscador from "./ProductosBuscador";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const { supabase, perfil } = await getSession();

  const [cat, ubi] = await Promise.all([
    supabase.from("categorias").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("ubicaciones").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return (
    <div>
      <PageHeader
        titulo="Productos"
        descripcion="Busca por código, serie o modelo y filtra por categoría, ubicación o estado."
        acciones={
          perfil.rol !== "consultor" ? (
            <Link href="/productos/nuevo" className="btn-primary">
              <PackagePlus className="h-4 w-4" /> Registrar producto
            </Link>
          ) : undefined
        }
      />
      <ProductosBuscador
        categorias={(cat.data ?? []) as Opcion[]}
        ubicaciones={(ubi.data ?? []) as Opcion[]}
      />
    </div>
  );
}
