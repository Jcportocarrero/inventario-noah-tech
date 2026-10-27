-- =====================================================================
-- 03. Catalogos de EJEMPLO (opcional). Edita los nombres a tu realidad
-- antes de ejecutar. Se puede volver a correr sin duplicar.
-- =====================================================================
insert into public.categorias (nombre, stock_minimo) values
  ('Laptops', 2), ('Computadoras de escritorio', 1), ('Monitores', 2),
  ('Impresoras', 1), ('Routers y switches', 1), ('Servidores', 0),
  ('Celulares y tablets', 2), ('Perifericos', 5), ('Almacenamiento', 2)
on conflict (nombre) do nothing;

insert into public.marcas (nombre) values
  ('Dell'), ('HP'), ('Lenovo'), ('Asus'), ('Acer'), ('Apple'), ('Samsung'),
  ('TP-Link'), ('Cisco'), ('Logitech'), ('Epson'), ('Kingston')
on conflict (nombre) do nothing;

insert into public.ubicaciones (nombre, descripcion) values
  ('Almacen principal', 'Stock disponible sin asignar'),
  ('Oficina de TI', 'Area de TI y Desarrollo'),
  ('Area comercial', 'Gerencia comercial y ventas'),
  ('Gerencia General', null),
  ('Soporte tecnico', 'Equipos en revision o reparacion')
on conflict (nombre) do nothing;
