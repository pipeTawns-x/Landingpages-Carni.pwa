/**
 * `?acceso` is not read by any plugin: the sign-in entry adds it to the stylesheets it shares with
 * the other pages so each page keeps its own copy, in its own order (see src/entry/auth.tsx).
 * TypeScript only needs to know that such an import is a side-effect import of a stylesheet.
 */
declare module '*.css?acceso';
