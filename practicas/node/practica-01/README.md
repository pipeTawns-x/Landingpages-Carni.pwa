# Práctica Node.js 01 — API HTTP con axios + chalk

**Módulo EBAC:** Node.js — Fundamentos
**Rama:** `practicas-ebac` (nunca mergear a `main`)
**Estado:** Implementada ✅

## Qué demuestra

| Concepto | Implementación |
|---|---|
| `require` / módulos CommonJS | `dotenv`, `axios`, `chalk` |
| `async/await` | Llamadas a Open-Meteo Geocoding + Forecast API |
| Variables de entorno | `.env` con `EBAC_CITY`, `EBAC_GEOCODE_URL`, `EBAC_WEATHER_URL` |
| Manejo de errores | `try/catch` + `process.exitCode = 1` |
| Output con color | `chalk` para formato de terminal |

## Dominio aplicado

La práctica consulta el clima en **San Luis Potosí, México** (ciudad donde opera Carnicería El Señor de La Misericordia) usando Open-Meteo (gratuita, sin API key).

## Cómo correr

```bash
# Desde la carpeta de la práctica
cd practicas/node/practica-01

# Instalar deps si no están
npm install dotenv axios chalk

# Correr
node app.js
```

## Archivo principal

El archivo `app.js` está actualmente en la **raíz del worktree** (`Carni-mvp-practicas/app.js`). Pendiente mover a esta carpeta.

- [ ] **Pendiente:** mover `app.js` del root a `practicas/node/practica-01/app.js`
- [ ] Agregar `package.json` standalone para esta práctica
