# Práctica React 01 — Componentes de Clase

**Módulo EBAC:** React — Fundamentos
**Rama:** `practicas-ebac` (nunca mergear a `main`)

## Qué demuestra esta práctica

| Concepto | Implementación |
|---|---|
| Class component | `App.js` extiende `React.Component` |
| `constructor` + `state` | Lista de cortes de res en estado inicial |
| `componentDidMount` | Log de confirmación + carga inicial |
| Composición de componentes | `<Header>` + `<ProductCard>` hijos de `<App>` |
| `React.createElement` | Render sin JSX para entender la API base |
| Props | `ProductCard` recibe `name`, `price_per_kg`, `category` |

## Dominio aplicado

En lugar del placeholder genérico "Biblioteca Musical" con canciones, esta práctica usa el dominio real de Carni-mvp:

- `App.js` maneja una lista de **cortes de carne** (Arrachera, Rib Eye, Costilla) con `price_per_kg` y `category`
- `Header.js` muestra el nombre de la carnicería y el logo
- `ProductCard.js` renderiza un corte con nombre, precio por kg y categoría

## Cómo correr

```bash
# Desde la raíz del worktree practicas-ebac (no desde main)
cd /Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-practicas

# La práctica usa el entry point ebac-react.html que apunta a src/main.jsx
# Temporalmente hasta que se migre la práctica a esta carpeta:
pnpm dev   # Vite sirve en :3002, abrir /ebac-react.html
```

## Estado de migración

- [x] Práctica implementada (en `src/App.js`, `src/components/Header.js`, `src/components/Song.js`)
- [ ] **Pendiente:** migrar archivos a esta carpeta (`practicas/react/practica-01/`) y aislar del `src/` principal
- [ ] **Pendiente:** reemplazar el tema "Biblioteca Musical" con el dominio Carni-mvp (cortes de carne)
- [ ] **Pendiente:** agregar entry point propio (no usar `ebac-react.html` del root)

## Archivos actuales (pendiente de migrar)

```
src/App.js              → mover a practicas/react/practica-01/App.js
src/components/Header.js → mover a practicas/react/practica-01/components/Header.js
src/components/Song.js   → renombrar a ProductCard.js, mover a practica-01/components/
ebac-react.html          → mover a practicas/react/practica-01/index.html
```
