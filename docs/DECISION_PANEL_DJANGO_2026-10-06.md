# Decisión: el panel administrativo lo sirve Django

Fecha: 2026-10-06 · Decide: Eduardo · Estado: vigente

## Contexto

- Dos documentos se contradecían y ninguno decía cuál mandaba:
  - Engram #641 (16-sep) decía que el panel lo sirve Django;
  - ESTADO #12, `06-plano` §5.4 y `MAPA` §4 (rama `pruebas`) decían "panel en React sobre Supabase, Django aparte".
- Sin una decisión escrita, la práctica M13 construyó un panel aislado (`/inventario/`), con tema propio y login propio, en vez de mejorar el dashboard existente. La M14 continuó esa línea.
- El dashboard actual (`dashboar.html`, `admin-*.html`) muestra casi solo datos inventados. El único CRUD real del sistema es el de Django.

## Decisión

1. Responsabilidades:

   | Pieza | Responsabilidad |
   |---|---|
   | Supabase | Base de datos, login y RLS |
   | Django | Sirve el panel: rutas, seguridad en el servidor y reglas del negocio |
   | Tailwind | Estilos, con los mismos tokens que la tienda |
   | React | Solo islas, donde hace falta interacción |

2. **Se mejora en el lugar.** El agente del rediseño lleva al rediseño el HTML del panel que ya existe. Después el backend lo mueve con `git mv` a las plantillas de Django y le pone los datos. No se crean páginas paralelas ni hay redirecciones entre una página vieja y una nueva.
3. Las rutas pasan a `/panel/...`, según la tabla única de `docs/CONTRATO_PANEL_DJANGO.md`.
4. **Acceso.** Login de Supabase en `accessweb.html`. Un formulario POST lleva el `access_token` a `/panel/sesion/`. Django lo verifica (firma, vigencia y `profiles.role = 'admin'`) y abre su propia sesión. Django nunca guarda contraseñas.
5. La tienda (`index.html`, `products.html`, `accessweb.html`) sigue siendo estática sobre Supabase. El perfil del cliente es la única página nueva; quién la sirve se fija en el contrato antes de construirla.

## Consecuencias

- Quedan superados: ESTADO #12, `06-plano` §5.4 y `MAPA` §4.2–4.5 (el shell React del panel). Engram #641 se confirma.
- Las prácticas M13 (vistas), M14 (modelos y admin) y M15 (plantillas) se construyen dentro de este panel.
- Django necesita un servidor encendido en producción. Mientras no se decida el hosting, el panel nuevo corre en local y en línea sigue el actual.
- Hacen falta tres permisos compartidos en `supabase/migrations`, que se proponen y Eduardo aprueba:
  - lectura de `profiles` para el traspaso de sesión;
  - lectura de `order_items` (ya existe);
  - lectura de `favorites` (ya existe).
