# Módulo · Estilos con React — resumen de las nueve lecciones

**Leído el 2026-09-04 del LMS de EBAC**, con la técnica de `ebac-lms-reader`: el
`.vtt` de Kinescope que aparece en las peticiones de red al cargar cada lección.

**Cinco transcripciones bajadas**, 6.386 líneas de subtítulos en total.

| Lección | Cómo se leyó |
|---|---|
| Sobre el trayecto | `.vtt` · 130 líneas |
| Aplica Inline Styling con React | `.vtt` · 910 líneas |
| Usa Tailwind con React | `.vtt` · 1.358 líneas |
| Crea styled-components con React | `.vtt` · 1.306 líneas |
| Crea styled-components (parte II) | `.vtt` · 1.682 líneas |
| Buenas prácticas | texto de la página |
| Refuerza tus conocimientos | texto de la página |
| Glosario | **solo los títulos** — ver abajo |
| Recapitula el trayecto | no leída |

**Lo que NO se pudo leer, dicho sin rellenar:** el Glosario lista sus siete
términos —CSS-in-JS, Hojas de estilo tradicionales, Styled Components, Tailwind
CSS, Tematización, ThemeProvider, Utility First— pero sus definiciones están en
acordeones que no se abrieron. Y *Recapitula el trayecto* no se abrió.

---

## Clase 1 · Sobre el trayecto

> *"Los componentes en React son los bloques básicos para la construcción de una
> app. El estilizarlos es una parte importante de nuestro trabajo como
> desarrolladores de frontend. Por lo tanto, debemos elegir correctamente el
> método adecuado para cada proyecto."*

La frase que gobierna el módulo: **no hay un método único correcto**. Hay que
elegir según el proyecto.

---

## Clase 2 · Inline Styling y hojas de estilo

### Lo literal

- El atributo `style` en React **espera un objeto**, no una cadena. Las claves
  van en `camelCase`
- Se puede sacar a una variable en vez de escribirlo dentro del JSX
- **No hace falta tiparlo:** *"no nos vamos a poner a tipar cada una de estas
  porque no vale la pena, no son propiedades que vengan dinámicas"*
- La ventaja real es el **estilo dinámico**: un ternario sobre `borderColor`
  según haya error o no

### Las desventajas, tal como las enumera

> *"los estilos en línea se deben de evitar principalmente por la reusabilidad"*

- **No son reutilizables** — es la razón principal
- **Hinchan el JSX**: hay que escribir muchos estilos dentro del marcado
- **Especificidad alta**, y *"generalmente juega en contra porque no vamos a ser
  capaces de sobreescribir"*

### Interpretación para Carni-mvp

Es exactamente el patrón que este proyecto ya evita: los componentes usan clases,
no `style`. La única excepción legítima es un valor calculado en tiempo de
ejecución, como el `--reveal-delay` del bento.

---

## Clase 3 · Tailwind

- Es un framework **Utility First**
- *"proporcionarnos una manera rápida y eficiente de estilizar las aplicaciones
  sin necesidad de abandonar nuestro archivo de marcado"*
- *"La filosofía Utility First promueve la composición y reutilización de estilos
  a través de clases utilitarias"*
- Las clases son atómicas: `w-96`, `w-80`, `w-72`
- **Agrupar las clases por tipo** para no perder la legibilidad — es objetivo
  declarado de la lección

### Interpretación

Tailwind **no se instala** en este proyecto. Ya hay un sistema de diseño en SCSS
con su propio ADN de color, y meter un segundo vocabulario de estilos encima
sería tener dos.

---

## Clase 4 · styled-components

### Qué es, en sus palabras

> *"una librería muy popular entre los desarrolladores de React, porque tiene un
> enfoque un poco diferente, innovador en la estilización"*

> *"Cada componente estilizado que creemos es un componente de React. Es decir,
> estamos creando la estilización y al mismo tiempo estamos creando un
> componente."*

- Permite escribir **CSS dentro de JavaScript**, con todo lo que CSS ya trae:
  selectores, pseudoclases, animaciones
- **Aísla los estilos** y evita conflictos
- *"la lógica del componente y el estilo residen en el mismo lugar"*, así que es
  más fácil de consultar y de mantener
- Sirve también para React Native
- Empresas que lo usan, del showcase que muestra: IMDb, Spotify, Target, Patreon

### El método, paso a paso

```
npm install styled-components
npm install styled-reset
```

Una carpeta en `src/`. Él la llama **`theme`**: *"hay unos que les llaman styles,
otros que les llamamos theme; a mí me gusta llamarle theme, me parece que queda
más claro"*.

Dentro, dos archivos:

**`theme/index.js`** — el tema es *"un objeto que va a contener las propiedades
de un estilo que deseamos que sean accesibles para toda la aplicación"*. En su
ejemplo: `colors` con `primary` y `secondary`, y `fonts` con `base`.

**`theme/global.js`** — `createGlobalStyle`, para *"establecer estilos base, por
ejemplo resetear márgenes, paddings, definir fuentes por defecto"*. Ahí importa
el `reset` de `styled-reset`.

Los valores del tema se leen con una función de flecha dentro de la interpolación:
`${props => props.theme.fonts.base}`.

Y en `App`, **arriba de todo**, `<ThemeProvider theme={theme}>` envolviendo la
aplicación, más `<GlobalStyle />`.

---

## Clase 5 · styled-components, parte II

Es la clase de refactorización: toma un componente que ya existe y lo reescribe.

- Se empieza **mirando qué elementos HTML necesita** el componente: sección,
  artículo, imagen, título, textos
- Cada uno pasa a ser un `styled.<elemento>`
- Se valora **qué sobra**: *"vamos a valorar si en realidad necesitamos ese
  botón, si no, simplemente lo vamos a eliminar y no pasa nada"*
- Se hace **poco a poco y parte por parte**, no de golpe

### Interpretación

Es exactamente la estrategia del bloque 3 de este lazo: migrar de dos en dos, no
el sitio entero.

---

## Clase 6 · Buenas prácticas

Literal de la lección, los cuatro puntos:

- **Styled Components para estilos modulares** — estilos a nivel de componente,
  útil en proyectos grandes donde la consistencia y la escalabilidad son clave
- **Tailwind para personalización** — Utility First da control total, ideal
  cuando se necesita mucha personalización
- **Organizar los estilos para la legibilidad** — sea cual sea el método:
  convenciones de nombres claras y separación lógica
- **Tematización para la escalabilidad** — estilos globales ajustables, útil
  cuando hay que soportar varios temas o marcas

---

## Notas de estudio

Líneas cortas, sin alineación por columnas, para pegar en el LMS.

— No hay un método de estilizado correcto: se elige según el proyecto.
— El atributo `style` de React espera un objeto, no una cadena.
— Las claves de ese objeto van en camelCase.
— Los estilos en línea no se reutilizan: esa es su desventaja principal.
— También hinchan el JSX y tienen especificidad alta.
— Su única ventaja real es el estilo dinámico con un ternario.
— Tailwind es Utility First: clases atómicas sobre el marcado.
— Sus clases se agrupan por tipo o el JSX se vuelve ilegible.
— En styled-components, cada estilo ES un componente de React.
— El estilo y la lógica viven en el mismo archivo.
— Los estilos quedan aislados y no chocan entre componentes.
— El tema es un objeto con los valores comunes de toda la app.
— `createGlobalStyle` es para reinicios y tipografía base.
— `styled-reset` da el reinicio ya hecho, desde npm.
— `ThemeProvider` va arriba de todo y envuelve la aplicación.
— Los valores del tema se leen con `props => props.theme.algo`.
— Refactorizar se hace parte por parte, no de golpe.
— Al refactorizar, se aprovecha para borrar lo que sobra.

---

## Refuerza tus conocimientos

Las nueve preguntas son literales de la lección. Las respuestas son mías, con lo
que dicen las clases.

**¿Qué son los Styled Components en React?**
Una librería de CSS-in-JS donde cada estilo es a la vez un componente de React.
El estilo y la lógica viven en el mismo archivo, y los estilos quedan aislados.

**¿Cómo se aplican los estilos globales y la tematización?**
El tema es un objeto con los valores comunes, y se reparte con `ThemeProvider`
envolviendo la aplicación. Los estilos globales se declaran con
`createGlobalStyle` y se montan como un componente más.

**¿Qué es Tailwind CSS y en qué se diferencia?**
Un framework Utility First. En vez de dar componentes ya diseñados, da clases
atómicas que se componen sobre el marcado.

**¿Cuáles son las ventajas de usar Tailwind?**
Rapidez, control total del diseño sin salir del JSX, y reutilización por
composición en lugar de por herencia.

**¿Cuáles son los métodos básicos de estilización en React?**
Estilos en línea, hojas de estilo externas —con o sin preprocesador—, frameworks
de utilidades como Tailwind, y CSS-in-JS como styled-components.

**¿Qué desventajas presentan los estilos en línea?**
No se reutilizan, hinchan el JSX, y su especificidad alta hace difícil
sobreescribirlos.

**¿Cómo pueden las hojas de estilo tradicionales mejorarse con Sass?**
Con variables, anidamiento, mixins y partials, que dan la organización que el CSS
plano no trae.

**¿Por qué es importante organizar y estructurar los estilos?**
Porque sin convenciones de nombres y separación lógica, el proyecto se vuelve
imposible de mantener. Es una de las cuatro buenas prácticas de la lección.

**¿Cuándo es más apropiado usar Styled Components o Tailwind CSS?**
styled-components cuando importan la modularidad y la tematización, sobre todo en
proyectos grandes. Tailwind cuando se busca velocidad y personalización sin salir
del marcado. Lo que no conviene es tener los dos: son dos vocabularios de estilo
para el mismo problema.
