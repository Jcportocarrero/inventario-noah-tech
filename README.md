# Inventario · NOAH TECH SOLUTIONS

Sistema web de registro de inventario de productos tecnológicos.
Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Auth + PostgreSQL con RLS).

## 1. Base de datos (Supabase > SQL Editor)

Ejecuta en este orden, cada script completo:

1. `supabase/01_schema_inventario.sql`  → tablas, RLS, triggers, vistas de KPIs
2. `supabase/02_funciones_consulta.sql` → historial y últimos movimientos
3. `supabase/03_seed_catalogos_ejemplo.sql` → (opcional) categorías, marcas y ubicaciones de ejemplo

## 2. Autenticación (Supabase > Authentication)

- **Providers > Email**: desactiva *Allow new users to sign up* (los usuarios los crea el administrador).
- Desactiva *Confirm email* o crea los usuarios con *Auto Confirm User*.

## 3. Primer administrador

1. Authentication > Users > **Add user** (correo + contraseña, *Auto Confirm User* activado).
2. En el SQL Editor:

```sql
insert into public.perfiles (id, nombre_completo, correo, rol)
select id, 'NOMBRE COMPLETO', email, 'administrador'
from auth.users where email = 'CORREO_DEL_ADMIN';
```

Para operadores y consultores, repite con `rol = 'operador'` o `'consultor'`
(hasta que exista la pantalla de gestión de usuarios).

## 4. Ejecutar el proyecto

```bash
npm install
cp .env.local.example .env.local   # completa URL y anon key de Supabase
npm run dev                         # http://localhost:3000
```

## Estructura

- `src/middleware.ts` → sesión + redirección y bloqueo de rutas por rol
- `src/app/login` → inicio de sesión
- `src/app/(app)/admin | operador | consultor` → pantalla principal de cada actor
- `src/app/(app)/productos` → listado con búsqueda, ficha con historial y `nuevo` (registro)
- `src/lib/kpis.ts` → línea base y metas de los KPIs (Tablas 1 y 2 del informe)

## Cómo se miden los KPIs dentro del sistema

| KPI | Medición |
|---|---|
| Tiempo de registro | Desde que se toca el formulario hasta guardar (`metricas_uso`, tipo `registro`) |
| Tiempo de búsqueda | Desde la primera búsqueda hasta abrir un producto (`metricas_uso`, tipo `busqueda`) |
| Exactitud | Último conteo físico (`conteos_fisicos` / `conteo_detalle`) |
| Trazabilidad | Productos con serie, ubicación, estado e historial de movimientos |
| Errores de registro | Revisión de muestra; el sistema bloquea duplicados y campos vacíos |
