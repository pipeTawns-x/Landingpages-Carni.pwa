-- Bucket `product-images` (migracion 20261117000001_product_images_bucket.sql).
--
-- A diferencia de las pruebas comercio_v1_*, esta necesita el esquema `storage`, que existe en el
-- stack local de Supabase y no en la base de trabajo comercio_v1_test de correr.sh. Se corre contra
-- el stack local, ya aplicada la migracion:
--   supabase test db --local           (o: psql ... -f supabase/tests/product_images_bucket.sql)
-- Es pgTAP; todo va en una transaccion que se revierte. NO se ha ejecutado todavia.

BEGIN;
SELECT plan(10);

SELECT is(
    (SELECT public FROM storage.buckets WHERE id = 'product-images'), true,
    'el bucket product-images es publico');
SELECT is(
    (SELECT file_size_limit FROM storage.buckets WHERE id = 'product-images'), 5242880::bigint,
    'el limite es de 5 MB');
SELECT is(
    (SELECT allowed_mime_types FROM storage.buckets WHERE id = 'product-images'),
    ARRAY['image/jpeg', 'image/png', 'image/webp'],
    'solo jpeg, png y webp');

-- Un objeto de prueba, creado como superusuario (sin RLS).
INSERT INTO storage.objects (bucket_id, name) VALUES ('product-images', '1/prueba.png');

-- anon y authenticated (cliente) no escriben ni listan.
SET LOCAL ROLE anon;
SELECT throws_ok(
    $$INSERT INTO storage.objects (bucket_id, name) VALUES ('product-images', '1/anon.png')$$,
    '42501', NULL, 'anon no puede subir');
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id = 'product-images'), 0::bigint,
    'anon no puede listar el bucket');
RESET ROLE;

SELECT set_config('request.jwt.claims',
    jsonb_build_object('sub', '00000000-0000-0000-0000-0000000000c1', 'role', 'authenticated')::text,
    true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
    $$INSERT INTO storage.objects (bucket_id, name) VALUES ('product-images', '1/cliente.png')$$,
    '42501', NULL, 'un cliente autenticado no puede subir');
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id = 'product-images'), 0::bigint,
    'un cliente no lista el bucket');
DELETE FROM storage.objects WHERE bucket_id = 'product-images';
RESET ROLE;
SELECT is((SELECT count(*) FROM storage.objects WHERE name = '1/prueba.png'), 1::bigint,
    'un cliente no puede borrar objetos');

-- service_role si escribe y borra.
SET LOCAL ROLE service_role;
SELECT lives_ok(
    $$INSERT INTO storage.objects (bucket_id, name) VALUES ('product-images', '1/servidor.png')$$,
    'service_role puede subir');
SELECT lives_ok(
    $$DELETE FROM storage.objects WHERE bucket_id = 'product-images' AND name = '1/servidor.png'$$,
    'service_role puede borrar');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
