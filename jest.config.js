/**
 * Configuracion de Jest para dos mundos que no se pueden mezclar.
 *
 * El repo ya tenia una suite corriendo (tests/functions.test.js, la practica
 * m33) con CERO configuracion: Jest en entorno `node`, sin transformador real
 * y con NODE_OPTIONS=--experimental-vm-modules. Esa suite funciona por como se
 * resuelve hoy y tocarla no aporta nada a la practica m34.
 *
 * Por eso NO se agrega un babel.config.js en la raiz: Babel busca su config
 * subiendo por el arbol de carpetas, asi que un archivo ahi arriba le caeria
 * encima tambien a los .js de la practica anterior y les cambiaria la forma de
 * cargarse. Los presets viajan EN LINEA aqui, con `configFile: false`, para que
 * el alcance sea exactamente el proyecto que los pide.
 *
 * `projects` mantiene los dos mundos separados de verdad: cada uno con su
 * entorno, su testMatch y su transformador. Sin esto habria que elegir un solo
 * `testEnvironment` global y jsdom para los .js de m33 es ruido innecesario.
 */

/**
 * Babel y no ts-jest.
 *
 * Los componentes se compilan con Babel, que BORRA los tipos en vez de
 * comprobarlos. Suena a perder algo y no lo es: el chequeo de tipos ya lo hace
 * `npm run ts:check` sobre todo el proyecto, y duplicarlo dentro de cada
 * ejecucion de tests solo agrega segundos. Ademas ts-jest en un proyecto ESM
 * pide su propia rama de configuracion; Babel no.
 */
const transformarTsx = [
  'babel-jest',
  {
    babelrc: false,
    configFile: false,
    presets: [
      // Compila a CommonJS contra el Node que esta corriendo. Es lo que hace
      // que los `import` de los componentes funcionen dentro de Jest.
      ['@babel/preset-env', { targets: { node: 'current' } }],
      // `automatic`: el proyecto usa jsx: react-jsx, asi que los componentes no
      // importan React y no deben tener que hacerlo para los tests.
      ['@babel/preset-react', { runtime: 'automatic' }],
      '@babel/preset-typescript'
    ]
  }
];

module.exports = {
  projects: [
    {
      // La practica m33 tal cual estaba: nada que probar aqui.
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.js', '<rootDir>/js/**/*.test.js'],
      // Con Jest 30 el runtime dejó de compilar `import` en .js de paquete
      // CommonJS (CjsParseError). El mismo transform Babel que ya usa el
      // proyecto react lo resuelve: preset-env baja el ESM a require.
      transform: {
        '^.+\\.[jt]sx?$': transformarTsx
      }
    },
    {
      displayName: 'react',
      testEnvironment: 'jsdom',
      // Solo *.test.tsx. El testMatch por defecto de Jest recoge CUALQUIER
      // archivo dentro de un __tests__/, y eso convertiria al helper compartido
      // en una suite vacia que falla con "must contain at least one test".
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
      setupFiles: ['<rootDir>/src/components/__tests__/polyfillsJsdom.ts'],
      transform: {
        '^.+\\.[jt]sx?$': transformarTsx
      },
      // El alias que usa el codigo de produccion (vite.config.ts y tsconfig).
      // Sin esto, `@src/theme/carniTheme` no existe para Jest.
      moduleNameMapper: {
        '^@src/(.*)$': '<rootDir>/src/$1'
      }
    }
  ],
  // Carpetas de salida: `dist` y `ts` guardan copias compiladas del mismo
  // codigo, y sin esto Jest correria cada test dos veces.
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/ts/', '/graphify-out/'],
  collectCoverageFrom: [
    'src/components/CartPanel/CartPanel.tsx',
    'src/components/OrderList/OrderList.tsx',
    'src/components/ProductCard/ProductCard.tsx'
  ]
};
