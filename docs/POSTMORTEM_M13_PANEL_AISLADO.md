# Post-mortem: la M13 construyó un panel aparte en vez de mejorar el dashboard

Fecha: 2026-10-06 · Práctica: M13 Django Views (calificada 100/100) · Repetido en: M14

## Qué se pidió

Llevar las vistas de Django al proyecto real: que el CRUD de productos viviera en el dashboard administrativo de Carni-mvp, con el rediseño de Claude Design.

## Qué se hizo

- Se creó `/inventario/`, un panel suelto:
  - con su propio `base.html` de tema claro, sin los tokens del rediseño;
  - con login propio de Django;
  - sin ningún enlace hacia `dashboar.html` ni desde él.
- La M14 continuó en el mismo panel aislado: le agregó paginación a `/inventario/`.
- Las reglas del negocio sí estaban bien hechas: confirmar el cambio de precio y desactivar en vez de borrar. El error fue de *dónde* se construyó, no de *qué* se construyó.

## Por qué pasó

- Los documentos se contradecían:
  - Engram #641: "el panel lo sirve Django";
  - el plan del rediseño: "panel en React sobre Supabase, Django aparte".
- Ninguno decía cuál mandaba, así que el backend decidió por su cuenta.
- El estilo se dejó "para la M15", y eso hizo aceptable una cara provisional distinta del rediseño.
- Ya había pasado antes: se pidió una mejora dentro del proyecto y se entregó algo nuevo al lado.

## Qué costó

- Tokens y tiempo gastados en una interfaz que no se va a usar.
- Una entrega (M14) que no se puede mandar tal como quedó.
- Desconfianza en el proceso.

## Qué cambia

1. **Regla permanente:** toda página del panel nace del archivo HTML que ya existe, movido con `git mv` y mejorado. Nunca se crea una página paralela. El commit dice qué archivo mejora.
2. **Decisión escrita:** `docs/DECISION_PANEL_DJANGO_2026-10-06.md` fija quién sirve el panel.
3. **Contrato entre agentes:** `docs/CONTRATO_PANEL_DJANGO.md` fija las rutas, los dueños de cada archivo y cómo se piden las páginas.
4. **Memoria:** la regla quedó en Engram (`panel-django/decision`) y en la memoria del agente.
5. **Antes de construir cualquier página:** se busca qué archivo existente le corresponde; si los documentos se contradicen, se pide la decisión antes de escribir código.
