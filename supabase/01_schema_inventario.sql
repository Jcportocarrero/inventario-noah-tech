-- =====================================================================
-- SISTEMA DE INVENTARIO - NOAH TECH SOLUTIONS S.A.C.
-- Esquema para Supabase (PostgreSQL). Basado en la Figura 16 del informe.
-- Ejecutar COMPLETO en: Supabase > SQL Editor > New query > Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLAS
-- ---------------------------------------------------------------------

create table public.categorias (
  id            uuid primary key default gen_random_uuid(),
  nombre        varchar(60) not null unique,
  descripcion   text,
  stock_minimo  integer not null default 0 check (stock_minimo >= 0),
  activo        boolean not null default true
);

create table public.marcas (
  id      uuid primary key default gen_random_uuid(),
  nombre  varchar(60) not null unique,
  activo  boolean not null default true
);

create table public.proveedores (
  id            uuid primary key default gen_random_uuid(),
  razon_social  varchar(120) not null,
  ruc           char(11) unique,
  contacto      varchar(100),
  activo        boolean not null default true
);

create table public.ubicaciones (
  id           uuid primary key default gen_random_uuid(),
  nombre       varchar(80) not null unique,
  descripcion  text,
  activo       boolean not null default true
);

-- perfiles: un registro por usuario de Supabase Auth (auth.users)
create table public.perfiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  nombre_completo  varchar(100) not null,
  correo           varchar(120) not null unique,
  rol              varchar(15) not null
                   check (rol in ('administrador', 'operador', 'consultor')),
  activo           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.productos (
  id             uuid primary key default gen_random_uuid(),
  codigo         varchar(30) not null unique,
  numero_serie   varchar(60) not null unique,
  categoria_id   uuid not null references public.categorias (id),
  marca_id       uuid not null references public.marcas (id),
  proveedor_id   uuid references public.proveedores (id),
  modelo         varchar(80) not null,
  ubicacion_id   uuid not null references public.ubicaciones (id),
  estado         varchar(15) not null
                 check (estado in ('disponible', 'asignado', 'en_reparacion', 'de_baja')),
  garantia_hasta date,
  fecha_ingreso  date not null default current_date,
  motivo_baja    varchar(15)
                 check (motivo_baja in ('venta', 'obsolescencia', 'dano', 'garantia')),
  fecha_baja     date,
  registrado_por uuid not null references public.perfiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- baja logica coherente: de_baja <=> tiene motivo
  constraint productos_baja_coherente
    check ((estado = 'de_baja') = (motivo_baja is not null))
);

create table public.movimientos (
  id                    uuid primary key default gen_random_uuid(),
  producto_id           uuid not null references public.productos (id),
  tipo                  varchar(15) not null
                        check (tipo in ('ingreso', 'salida', 'traslado', 'cambio_estado', 'baja')),
  ubicacion_origen_id   uuid references public.ubicaciones (id),
  ubicacion_destino_id  uuid references public.ubicaciones (id),
  estado_anterior       varchar(15),
  estado_nuevo          varchar(15),
  motivo                text,
  fecha_movimiento      timestamptz not null default now(),
  usuario_id            uuid not null references public.perfiles (id)
);

create table public.conteos_fisicos (
  id              uuid primary key default gen_random_uuid(),
  fecha           date not null default current_date,
  responsable_id  uuid not null references public.perfiles (id),
  observaciones   text
);

create table public.conteo_detalle (
  id           uuid primary key default gen_random_uuid(),
  conteo_id    uuid not null references public.conteos_fisicos (id) on delete cascade,
  producto_id  uuid not null references public.productos (id),
  coincide     boolean not null,
  observacion  text,
  unique (conteo_id, producto_id)
);

-- ADICION (no esta en la Figura 16): mide en el propio sistema el tiempo
-- de registro y de busqueda para comparar contra la linea base (KPIs 1 y 2).
create table public.metricas_uso (
  id          uuid primary key default gen_random_uuid(),
  tipo        varchar(10) not null check (tipo in ('registro', 'busqueda')),
  duracion_ms integer not null check (duracion_ms >= 0),
  usuario_id  uuid not null default auth.uid() references public.perfiles (id),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. INDICES (busqueda en menos de 3 s, RNF-01)
-- ---------------------------------------------------------------------
create index idx_productos_categoria on public.productos (categoria_id);
create index idx_productos_marca     on public.productos (marca_id);
create index idx_productos_ubicacion on public.productos (ubicacion_id);
create index idx_productos_estado    on public.productos (estado);
create index idx_movimientos_producto on public.movimientos (producto_id, fecha_movimiento desc);
create index idx_conteo_detalle_conteo on public.conteo_detalle (conteo_id);
create index idx_metricas_tipo_fecha on public.metricas_uso (tipo, created_at desc);

-- ---------------------------------------------------------------------
-- 3. FUNCIONES Y TRIGGERS
-- ---------------------------------------------------------------------

-- Rol del usuario autenticado (null si no tiene perfil o esta inactivo)
create or replace function public.mi_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid() and activo
$$;

revoke all on function public.mi_rol() from public, anon;
grant execute on function public.mi_rol() to authenticated;

-- Antes de actualizar un producto: updated_at y reglas de baja logica
create or replace function public.fn_productos_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if old.estado = 'de_baja' and public.mi_rol() is distinct from 'administrador' then
    raise exception 'El producto esta dado de baja; solo el administrador puede modificarlo';
  end if;

  if new.estado = 'de_baja' and old.estado is distinct from 'de_baja' then
    if public.mi_rol() is distinct from 'administrador' then
      raise exception 'Solo el administrador puede dar de baja un producto';
    end if;
    new.fecha_baja := coalesce(new.fecha_baja, current_date);
  end if;

  return new;
end;
$$;

create trigger trg_productos_before_update
  before update on public.productos
  for each row execute function public.fn_productos_before_update();

-- Despues de insertar/actualizar: registra el movimiento (trazabilidad)
create or replace function public.fn_productos_movimiento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := coalesce(auth.uid(), new.registrado_por);
begin
  if tg_op = 'INSERT' then
    insert into public.movimientos
      (producto_id, tipo, ubicacion_destino_id, estado_nuevo, motivo, usuario_id)
    values
      (new.id, 'ingreso', new.ubicacion_id, new.estado, 'Alta del producto', v_usuario);

  elsif new.estado = 'de_baja' and old.estado is distinct from 'de_baja' then
    insert into public.movimientos
      (producto_id, tipo, ubicacion_origen_id, estado_anterior, estado_nuevo, motivo, usuario_id)
    values
      (new.id, 'baja', old.ubicacion_id, old.estado, new.estado, 'Baja: ' || new.motivo_baja, v_usuario);

  elsif new.ubicacion_id is distinct from old.ubicacion_id then
    insert into public.movimientos
      (producto_id, tipo, ubicacion_origen_id, ubicacion_destino_id,
       estado_anterior, estado_nuevo, motivo, usuario_id)
    values
      (new.id, 'traslado', old.ubicacion_id, new.ubicacion_id,
       old.estado, new.estado, 'Cambio de ubicacion', v_usuario);

  elsif new.estado is distinct from old.estado then
    insert into public.movimientos
      (producto_id, tipo, ubicacion_origen_id, ubicacion_destino_id,
       estado_anterior, estado_nuevo, motivo, usuario_id)
    values
      (new.id, 'cambio_estado', old.ubicacion_id, new.ubicacion_id,
       old.estado, new.estado, 'Cambio de estado', v_usuario);
  end if;

  return new;
end;
$$;

create trigger trg_productos_movimiento
  after insert or update on public.productos
  for each row execute function public.fn_productos_movimiento();

-- ---------------------------------------------------------------------
-- 4. SEGURIDAD: RLS ACTIVADO + POLITICAS POR ROL
-- ---------------------------------------------------------------------
alter table public.categorias      enable row level security;
alter table public.marcas          enable row level security;
alter table public.proveedores     enable row level security;
alter table public.ubicaciones     enable row level security;
alter table public.perfiles        enable row level security;
alter table public.productos       enable row level security;
alter table public.movimientos     enable row level security;
alter table public.conteos_fisicos enable row level security;
alter table public.conteo_detalle  enable row level security;
alter table public.metricas_uso    enable row level security;

-- perfiles: cada usuario ve el suyo; el administrador gestiona todos
create policy perfiles_select on public.perfiles for select to authenticated
  using (id = auth.uid() or public.mi_rol() = 'administrador');
create policy perfiles_insert on public.perfiles for insert to authenticated
  with check (public.mi_rol() = 'administrador');
create policy perfiles_update on public.perfiles for update to authenticated
  using (public.mi_rol() = 'administrador')
  with check (public.mi_rol() = 'administrador');

-- catalogos: leen todos los roles; solo el administrador modifica
create policy categorias_select on public.categorias for select to authenticated
  using (public.mi_rol() is not null);
create policy categorias_insert on public.categorias for insert to authenticated
  with check (public.mi_rol() = 'administrador');
create policy categorias_update on public.categorias for update to authenticated
  using (public.mi_rol() = 'administrador') with check (public.mi_rol() = 'administrador');

create policy marcas_select on public.marcas for select to authenticated
  using (public.mi_rol() is not null);
create policy marcas_insert on public.marcas for insert to authenticated
  with check (public.mi_rol() = 'administrador');
create policy marcas_update on public.marcas for update to authenticated
  using (public.mi_rol() = 'administrador') with check (public.mi_rol() = 'administrador');

create policy proveedores_select on public.proveedores for select to authenticated
  using (public.mi_rol() is not null);
create policy proveedores_insert on public.proveedores for insert to authenticated
  with check (public.mi_rol() = 'administrador');
create policy proveedores_update on public.proveedores for update to authenticated
  using (public.mi_rol() = 'administrador') with check (public.mi_rol() = 'administrador');

create policy ubicaciones_select on public.ubicaciones for select to authenticated
  using (public.mi_rol() is not null);
create policy ubicaciones_insert on public.ubicaciones for insert to authenticated
  with check (public.mi_rol() = 'administrador');
create policy ubicaciones_update on public.ubicaciones for update to authenticated
  using (public.mi_rol() = 'administrador') with check (public.mi_rol() = 'administrador');

-- productos: leen todos; administrador y operador crean/editan (la baja la
-- restringe el trigger al administrador). No hay DELETE: solo baja logica.
create policy productos_select on public.productos for select to authenticated
  using (public.mi_rol() is not null);
create policy productos_insert on public.productos for insert to authenticated
  with check (public.mi_rol() in ('administrador', 'operador')
              and registrado_por = auth.uid());
create policy productos_update on public.productos for update to authenticated
  using (public.mi_rol() in ('administrador', 'operador'))
  with check (public.mi_rol() in ('administrador', 'operador'));

-- movimientos: auditables (sin UPDATE ni DELETE)
create policy movimientos_select on public.movimientos for select to authenticated
  using (public.mi_rol() is not null);
create policy movimientos_insert on public.movimientos for insert to authenticated
  with check (public.mi_rol() in ('administrador', 'operador')
              and usuario_id = auth.uid());

-- conteos fisicos (exactitud del inventario)
create policy conteos_select on public.conteos_fisicos for select to authenticated
  using (public.mi_rol() is not null);
create policy conteos_insert on public.conteos_fisicos for insert to authenticated
  with check (public.mi_rol() in ('administrador', 'operador')
              and responsable_id = auth.uid());
create policy conteos_update on public.conteos_fisicos for update to authenticated
  using (public.mi_rol() in ('administrador', 'operador'))
  with check (public.mi_rol() in ('administrador', 'operador'));

create policy conteo_det_select on public.conteo_detalle for select to authenticated
  using (public.mi_rol() is not null);
create policy conteo_det_insert on public.conteo_detalle for insert to authenticated
  with check (public.mi_rol() in ('administrador', 'operador'));
create policy conteo_det_update on public.conteo_detalle for update to authenticated
  using (public.mi_rol() in ('administrador', 'operador'))
  with check (public.mi_rol() in ('administrador', 'operador'));

-- metricas de uso: todos registran las suyas; solo el administrador las lee
create policy metricas_insert on public.metricas_uso for insert to authenticated
  with check (public.mi_rol() is not null and usuario_id = auth.uid());
create policy metricas_select on public.metricas_uso for select to authenticated
  using (public.mi_rol() = 'administrador');

-- ---------------------------------------------------------------------
-- 5. VISTAS PARA EL DASHBOARD DE KPIs (respetan RLS del usuario)
-- ---------------------------------------------------------------------
create view public.v_stock_por_categoria
with (security_invoker = true) as
select
  c.id as categoria_id,
  c.nombre as categoria,
  c.stock_minimo,
  count(p.id) filter (where p.estado <> 'de_baja')    as total,
  count(p.id) filter (where p.estado = 'disponible')  as disponibles,
  count(p.id) filter (where p.estado = 'disponible') < c.stock_minimo as stock_bajo
from public.categorias c
left join public.productos p on p.categoria_id = c.id
where c.activo
group by c.id, c.nombre, c.stock_minimo;

create view public.v_kpis
with (security_invoker = true) as
select
  -- KPI 1 y 2: tiempos promedio medidos por el sistema (segundos)
  (select round(avg(duracion_ms) / 1000.0, 1) from public.metricas_uso
    where tipo = 'registro') as tiempo_registro_prom_seg,
  (select round(avg(duracion_ms) / 1000.0, 1) from public.metricas_uso
    where tipo = 'busqueda') as tiempo_busqueda_prom_seg,
  -- KPI 3: exactitud del ultimo conteo fisico (%)
  (select round(100.0 * count(*) filter (where d.coincide) / nullif(count(*), 0), 1)
     from public.conteo_detalle d
    where d.conteo_id = (select id from public.conteos_fisicos
                          order by fecha desc limit 1)) as exactitud_pct,
  -- KPI 5: productos con serie, ubicacion, estado e historial (%)
  (select round(100.0 * count(*) filter (
            where p.numero_serie is not null and p.ubicacion_id is not null
              and p.estado is not null
              and exists (select 1 from public.movimientos m where m.producto_id = p.id))
          / nullif(count(*), 0), 1)
     from public.productos p) as trazabilidad_pct,
  (select count(*) from public.productos where estado <> 'de_baja') as total_productos,
  (select count(*) from public.productos where estado = 'disponible') as total_disponibles;

-- ---------------------------------------------------------------------
-- 6. PERMISOS (GRANT explicitos; anon sin acceso)
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated;

revoke all on all tables in schema public from anon;

grant select, insert, update on
  public.categorias, public.marcas, public.proveedores, public.ubicaciones,
  public.perfiles, public.productos, public.conteos_fisicos, public.conteo_detalle
  to authenticated;
grant select, insert on public.movimientos, public.metricas_uso to authenticated;
grant select on public.v_stock_por_categoria, public.v_kpis to authenticated;

-- ---------------------------------------------------------------------
-- 7. PRIMER ADMINISTRADOR (ejecutar DESPUES de crear el usuario en
--    Authentication > Users > Add user, con "Auto Confirm User" activado)
-- ---------------------------------------------------------------------
-- insert into public.perfiles (id, nombre_completo, correo, rol)
-- select id, 'NOMBRE COMPLETO', email, 'administrador'
-- from auth.users where email = 'CORREO_DEL_ADMIN';
