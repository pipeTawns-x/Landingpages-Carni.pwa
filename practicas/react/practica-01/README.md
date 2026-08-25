# Práctica React 01 — Componentes de Clase

**Módulo EBAC:** React — Fundamentos
**Rama:** `practicas-ebac` (nunca mergear a `main`)

## Qué demuestra esta práctica

| Concepto | Implementación |
|---|---|
| Class component | `InventoryApp.js` extiende `React.Component` |
| `constructor` + `state` | Lista de productos del inventario en estado inicial |
| `componentDidMount` | Log de confirmación de conexión al montar |
| Composición de componentes | `<InventoryHeader>` + `<ProductCard>` hijos de `<InventoryApp>` |
| `React.createElement` | Render sin JSX para entender la API base |
| Props | `ProductCard` recibe `nombre`, `precio_kg`, `stock`, `estado` |

## Dominio aplicado

En lugar del placeholder genérico "Biblioteca Musical" con canciones, esta práctica usa el dominio real de Carni-mvp:

- `InventoryApp.js` maneja una lista de **productos del inventario** (Rib Eye Premium, Picaña, Arrachera Marinada) con `precio_kg`, `stock` y `estado`
- `InventoryHeader.js` muestra el encabezado del inventario con el total de productos activos
- `ProductCard.js` renderiza un producto con nombre, precio por kg, stock y estado

## Cómo correr

```bash
# Desde la raíz del worktree practicas-ebac (no desde main)
cd /Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-practicas

# La práctica es autocontenida: practicas/react/practica-01/index.html carga ./main.jsx
pnpm dev   # Vite sirve en :3002, abrir /practicas/react/practica-01/index.html
```

## Archivos

```
InventoryApp.js                 → componente de clase principal
components/InventoryHeader.js   → encabezado del inventario
components/ProductCard.js       → tarjeta de producto
index.html + main.jsx           → entry point propio de la práctica
styles.css                      → estilos de la práctica
```
