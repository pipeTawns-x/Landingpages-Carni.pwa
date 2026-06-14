# Práctica React 02 — React + TypeScript

**Módulo EBAC:** React + TypeScript
**Rama:** `practicas-ebac` (nunca mergear a `main`)
**Estado:** Pendiente de implementación

## Qué debe demostrar esta práctica

| Concepto | Implementación esperada |
|---|---|
| `interface` / `type` | Tipos para `Product`, `Category`, `Order` del dominio Carni |
| Props tipadas | Componente funcional con props TypeScript |
| `useState<T>` | Estado con tipo explícito |
| Eventos tipados | `onClick: React.MouseEventHandler<HTMLButtonElement>` |
| `Array<T>` y `.map()` tipado | Lista de productos tipada |
| Enum o union type | `OrderStatus: 'received' | 'confirmed' | 'ready' | 'delivered'` |

## Dominio aplicado

Usar los tipos REALES del proyecto. El archivo `src/types/database.ts` en `main` contiene los tipos de Supabase — esta práctica debe derivar tipos simplificados de ahí para trabajar con:

- Lista de `Product[]` con TypeScript
- Componente `ProductCard` con props tipadas (`name: string`, `price_per_kg: number`, `category: string`)
- Estado de una orden con `OrderStatus` como union type

## Estructura objetivo

```
practicas/react/practica-02/
├── README.md          (este archivo)
├── index.html         (entry point propio, no usa el del root)
├── src/
│   ├── main.tsx       (entry con ReactDOM.createRoot)
│   ├── App.tsx
│   ├── types/
│   │   └── carni.ts   (interfaces Product, Order, OrderStatus)
│   └── components/
│       └── ProductCard.tsx
└── tsconfig.json      (config TypeScript standalone)
```

## Cómo proceder

1. Confirmar qué pide exactamente el temario EBAC para la práctica de TypeScript
2. Crear los archivos en esta carpeta con la estructura anterior
3. La práctica debe ser ejecutable de forma STANDALONE (no depende de Vite del root)
4. Hacer commit con `feat(ebac/react-02): ...` desde la rama `practicas-ebac`
