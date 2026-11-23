/**
 * `?products` is not read by any plugin: the products entry adds it to the stylesheets it shares
 * with the landing so each page keeps its own copy, in its own order (see src/entry/products.tsx).
 * TypeScript only needs to know that such an import is a side-effect import of a stylesheet.
 */
declare module '*.css?products';
