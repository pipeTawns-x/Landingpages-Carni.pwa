/// <reference types="vite/client" />

// Vite injects `import.meta.env` at build time — BASE_URL among it, which
// `assetUrl` in src/entry/shared.tsx uses to resolve database image paths
// against whichever base the site was built for. tsconfig.json pins an explicit
// `types` array, so the reference has to be declared here for tsc to see it.
