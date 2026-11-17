-- Fotos de producto: bucket publico `product-images` en Supabase Storage.
--
-- El panel de Django sube la foto con la llave de servidor (rol service_role); la tienda y cualquier
-- visitante solo la ven por su URL publica. Por eso:
--   * el bucket es publico: la URL /storage/v1/object/public/product-images/... se sirve sin
--     politica de lectura. A proposito NO hay politica SELECT para anon/authenticated, porque eso
--     permitiria LISTAR el bucket; quien tiene la URL ve la foto y nadie mas enumera.
--   * escribir, reemplazar y borrar es solo del rol service_role. Un cliente (anon, authenticated,
--     incluso un administrador desde el navegador) no puede tocar el bucket.
--   * un administrador (is_admin()) puede listar y leer los objetos desde el panel de Supabase.
--   * limite de 5 MB y solo image/jpeg, image/png, image/webp (Django valida lo mismo por bytes
--     antes de subir; esto es la segunda barrera).
-- Prueba: supabase/tests/product_images_bucket.sql (contra el stack local de Supabase).
-- Aplicar en local: `supabase migration up --local` (lo corre Eduardo). No se aplica en remoto.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

-- storage.objects ya trae RLS activo en Supabase; sin politica, anon y authenticated no escriben.
CREATE POLICY product_images_service_insert ON storage.objects
    FOR INSERT TO service_role
    WITH CHECK (bucket_id = 'product-images');

CREATE POLICY product_images_service_update ON storage.objects
    FOR UPDATE TO service_role
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

CREATE POLICY product_images_service_delete ON storage.objects
    FOR DELETE TO service_role
    USING (bucket_id = 'product-images');

CREATE POLICY product_images_admin_select ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'product-images' AND public.is_admin());

-- DOWN
-- DROP POLICY product_images_admin_select ON storage.objects;
-- DROP POLICY product_images_service_delete ON storage.objects;
-- DROP POLICY product_images_service_update ON storage.objects;
-- DROP POLICY product_images_service_insert ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'product-images';  -- falla si quedan objetos: vaciarlo antes
