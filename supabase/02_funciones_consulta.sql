-- =====================================================================
-- 02. Funciones de consulta y ajuste de v_kpis
-- Ejecutar DESPUES de 01_schema_inventario.sql
-- =====================================================================

-- Historial de un producto con nombres legibles (ubicaciones y usuario).
-- security definer: permite mostrar el nombre del responsable a todos los
-- roles sin abrir la tabla perfiles completa.
create or replace function public.historial_producto(p_producto_id uuid)
returns table (
  id uuid,
  tipo varchar,
  fecha_movimiento timestamptz,
  ubicacion_origen text,
  ubicacion_destino text,
  estado_anterior varchar,
  estado_nuevo varchar,
  motivo text,
  usuario text
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.tipo, m.fecha_movimiento,
         uo.nombre::text, ud.nombre::text,
         m.estado_anterior, m.estado_nuevo, m.motivo,
         pf.nombre_completo::text
  from public.movimientos m
  left join public.ubicaciones uo on uo.id = m.ubicacion_origen_id
  left join public.ubicaciones ud on ud.id = m.ubicacion_destino_id
  left join public.perfiles pf on pf.id = m.usuario_id
  where m.producto_id = p_producto_id
    and public.mi_rol() is not null
  order by m.fecha_movimiento desc, m.id
$$;

-- Ultimos movimientos del sistema (dashboard)
create or replace function public.ultimos_movimientos(p_limit integer default 10)
returns table (
  id uuid,
  tipo varchar,
  fecha_movimiento timestamptz,
  producto_id uuid,
  codigo varchar,
  modelo varchar,
  usuario text
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.tipo, m.fecha_movimiento, p.id, p.codigo, p.modelo,
         pf.nombre_completo::text
  from public.movimientos m
  join public.productos p on p.id = m.producto_id
  left join public.perfiles pf on pf.id = m.usuario_id
  where public.mi_rol() is not null
  order by m.fecha_movimiento desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50)
$$;

revoke all on function public.historial_producto(uuid) from public, anon;
revoke all on function public.ultimos_movimientos(integer) from public, anon;
grant execute on function public.historial_producto(uuid) to authenticated;
grant execute on function public.ultimos_movimientos(integer) to authenticated;

-- v_kpis: se agregan al final el n.° de altas y de busquedas medidas
create or replace view public.v_kpis
with (security_invoker = true) as
select
  (select round(avg(duracion_ms) / 1000.0, 1) from public.metricas_uso
    where tipo = 'registro') as tiempo_registro_prom_seg,
  (select round(avg(duracion_ms) / 1000.0, 1) from public.metricas_uso
    where tipo = 'busqueda') as tiempo_busqueda_prom_seg,
  (select round(100.0 * count(*) filter (where d.coincide) / nullif(count(*), 0), 1)
     from public.conteo_detalle d
    where d.conteo_id = (select id from public.conteos_fisicos
                          order by fecha desc limit 1)) as exactitud_pct,
  (select round(100.0 * count(*) filter (
            where p.numero_serie is not null and p.ubicacion_id is not null
              and p.estado is not null
              and exists (select 1 from public.movimientos m where m.producto_id = p.id))
          / nullif(count(*), 0), 1)
     from public.productos p) as trazabilidad_pct,
  (select count(*) from public.productos where estado <> 'de_baja') as total_productos,
  (select count(*) from public.productos where estado = 'disponible') as total_disponibles,
  (select count(*) from public.metricas_uso where tipo = 'registro') as n_registros,
  (select count(*) from public.metricas_uso where tipo = 'busqueda') as n_busquedas;

grant select on public.v_kpis to authenticated;
