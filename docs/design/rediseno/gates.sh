#!/bin/bash
# Compuertas mecánicas de las unidades del rediseño (06-plano.md §4.0).
# Uso: docs/design/rediseno/gates.sh [--rapido]   (--rapido salta ts:check/test/build)
# Sale con código 1 si alguna compuerta rg falla o si algo de Docker falla.
WT=/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas
cd "$WT" || exit 1
fallas=0
ok()   { printf "  ✓ %-4s %s\n" "$1" "$2"; }
falla(){ printf "  ✗ %-4s %s\n" "$1" "$2"; fallas=$((fallas+1)); }
aviso(){ printf "  · %-4s %s\n" "$1" "$2"; }

test "$(git branch --show-current)" = pruebas || { echo "rama equivocada"; exit 1; }
docker start carni-landing-dev >/dev/null 2>&1

echo "== HTTP"
# Páginas de producción (MAPA.md §1.1): aquí un 404 es FALLA, son las que
# el sitio sirve y las que cada rebanada tiene que dejar vivas.
for p in index products accessweb dashboar; do
  c=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/$p.html")
  [ "$c" = 200 ] && ok "$p" "200" || falla "$p" "$c"
done
# Rutas paralelas: landing, catalogo y panel se están por borrar en los pasos
# 1.7, 2.5 y 4.6, así que su 404 es AVISO, no FALLA.
for p in landing catalogo panel; do
  c=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/$p.html")
  [ "$c" = 200 ] && ok "$p" "200" || aviso "$p" "$c (404 esperado: se borra en su paso)"
done

if [ "$1" != "--rapido" ]; then
  echo "== Docker: typecheck, pruebas, build"
  docker exec carni-landing-dev npm run ts:check >/dev/null 2>&1 && ok ts "ts:check" || falla ts "ts:check"
  r=$(docker exec carni-landing-dev npm test 2>&1 | rg "^Tests:" | head -1); echo "$r" | rg -q "failed" && falla test "$r" || ok test "${r:-sin resumen}"
  docker exec carni-landing-dev npm run build >/dev/null 2>&1 && ok build "build" || falla build "build"
fi

echo "== Compuertas rg (0 coincidencias)"
N=""; for f in src/ui src/data src/landing src/catalogo src/asistente src/panel src/entry/landing.tsx src/entry/catalogo.tsx src/entry/panel.tsx landing.html catalogo.html panel.html; do [ -e "$f" ] && N="$N $f"; done
X=(-g '!*.json' -g '!seedProducts.ts' -g '!__tests__')
chk() { # chk <id> <patrón> [-P]
  local id=$1 pat=$2 flag=$3 n
  n=$(rg -n $flag "${X[@]}" "$pat" $N 2>/dev/null | wc -l | tr -d ' ')
  [ "$n" = 0 ] && ok "$id" "0" || { falla "$id" "$n coincidencias"; rg -n $flag "${X[@]}" "$pat" $N 2>/dev/null | head -3 | sed 's/^/        /'; }
}
chk G1  'innerHTML|dangerouslySetInnerHTML|eval\(|new Function'
chk G2  'js/modules|styled-components|montarCarrito|montarLupa|entry/shared'
chk G3  'cdn\.jsdelivr|unpkg\.com|fonts\.googleapis|fonts\.gstatic'
chk G4  "from\('(orders|order_items)'\)\.(insert|update|upsert|delete)"
chk G5  'falta backend|EJEMPLO|onfirmar con el due|No tenemos picaña|carniceriasenmisericordia|carniceriamisericordia\.com|mailto:'
chk G6  'VITE_(?!SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_KEY)' -P
chk G7  'service_role|sb_secret_|GROQ'
n=$(rg -n "${X[@]}" 'import\.meta\.env\.VITE' $N 2>/dev/null | rg -v 'src/data/supabase.ts' | wc -l | tr -d ' '); [ "$n" = 0 ] && ok G8 0 || falla G8 "$n"
chk G9  'en stock|existencia|Pocas piezas'
chk G10 'text-\[[0-9]|text-(xs|sm|base|lg|xl|[2-9]xl)\b|font-\[[0-9]'
chk G11 'rounded-(sm|md|lg|xl|2xl|3xl)\b|backdrop-blur'
u=$(rg -c uppercase src/ui src/catalogo src/asistente src/panel 2>/dev/null | wc -l | tr -d ' '); [ "$u" = 0 ] && ok G12 0 || falla G12 "$u archivos"
u=$(rg -o uppercase src/landing 2>/dev/null | wc -l | tr -d ' '); [ "$u" -le 2 ] && ok G13 "$u (máx. 2)" || falla G13 "$u"

# ---- D · Anti-duplicado. Bloque NUEVO: G1..G13 no se toca.
# Codifica MAPA.md §5.1 (puntos 1, 2, 5, 8, 9, 10 y 14) y LOOP-OPENCODE.md §7.
# Con --rapido corren SOLO D1, D2, D3 y D7, que son baratos (git log/diff del
# último commit). Sin --rapido corre el bloque entero: D4, D5 y D6 usan rg
# sobre el árbol entero y no valen la pena en el lazo corto.
DIF=$(git diff --name-status HEAD~1 2>/dev/null)
CUERPO_LS=$(git log -1 --format='%s%n%b' 2>/dev/null)

# D1 · ningún .html NUEVO en la raíz. Los .html permitidos en la raíz son
# EXACTAMENTE los ocho de MAPA.md §1.1: index, products, accessweb, dashboar,
# admin-products, admin-customers, admin-orders y offline. landing.html,
# catalogo.html y panel.html son deuda conocida que debe morir en 1.7, 2.5 y
# 4.6: mientras existan, su reaparición es AVISO y no falla; cualquier otro
# .html añadido a la raíz sí falla.
d1() {
  local altos="" nuevos="" deuda=0 n=0
  altos=$(printf '%s\n' "$DIF" | rg '^A\s+[^/]+\.html$' || true)
  nuevos=$(printf '%s\n' "$altos" | rg -v '\s(landing|catalogo|panel)\.html$|^$' || true)
  deuda=$(printf '%s\n' "$altos" | rg -c '\s(landing|catalogo|panel)\.html$' || true); deuda=${deuda:-0}
  n=$(printf '%s\n' "$nuevos" | rg -c '.' || true); n=${n:-0}
  [ "$n" = 0 ] && ok D1 0 \
    || { falla D1 "$n altas nuevas de .html en la raíz"; printf '%s\n' "$nuevos" | sed 's/^/        /'; }
  [ "$deuda" -gt 0 ] && aviso D1 "$deuda alta(s) de ruta paralela (deuda que muere en 1.7/2.5/4.6)"
  return 0
}

# D2 · ninguna entrada nueva en vite.config.js. Solo se permiten líneas «-».
d2() {
  local n; n=$(git diff -U0 HEAD~1 -- vite.config.js 2>/dev/null | rg -c '^\+.*resolve\(__dirname' || true)
  [ "${n:-0}" = 0 ] && ok D2 0 || { falla D2 "$n entradas nuevas en vite.config.js"; git diff -U0 HEAD~1 -- vite.config.js | rg '^\+.*resolve\(__dirname' | sed 's/^/        /'; }
  return 0
}

# D3 · un commit = una rebanada: no puede tocar dos páginas de producción a la
# vez (MAPA.md §5.1 punto 5, LOOP-OPENCODE.md §7 punto 2).
d3() {
  local pags n
  pags=$(printf '%s\n' "$DIF" | rg '(^|\t)(index|products|accessweb|dashboar|admin-[a-z]+)\.html$' \
         | rg -o '(index|products|accessweb|dashboar|admin-[a-z]+)\.html' | sort -u | tr '\n' ' ' || true)
  n=$(printf '%s' "$pags" | wc -w | tr -d ' ')
  [ "$n" -le 1 ] && ok D3 "$n de 8 páginas de producción" \
                 || { falla D3 "$n páginas en un commit: $pags"; }
  return 0
}

# D7 · mensaje del último commit: convencional, bilingüe (inglés / español) y
# sin atribución a IA (MAPA.md §5.1 punto 14, LOOP-OPENCODE.md §3 regla 5).
d7() {
  local asunto cuerpo malos=""
  asunto=$(printf '%s\n' "$CUERPO_LS" | sed -n '1p')
  cuerpo=$(printf '%s\n' "$CUERPO_LS" | sed '1d')
  printf '%s' "$asunto" | rg -q '^(feat|fix|refactor|chore|docs|test|perf|style|build|ci)(\([a-z0-9-]+\))?!?: .+' \
    || malos="$malos asunto-no-convencional,"
  printf '%s' "$asunto" | rg -q '\S[^/]* /\s*\S' \
    || malos="$malos sin-parte-en-espanol,"
  # La atribución se busca en el mensaje ENTERO, no solo en el asunto: la
  # regla global de Eduardo prohíbe la atribución en cualquier parte y
  # «Co-Authored-By» solo aparece nunca en el asunto, siempre en el cuerpo.
  printf '%s\n' "$CUERPO_LS" | rg -qi 'Co-Authored-By|Generated with|Claude|🤖|AI-generated' \
    && malos="$malos con-atribucion-a-IA,"
  [ -z "$(printf '%s' "$cuerpo" | tr -d '[:space:]')" ] && malos="$malos cuerpo-vacio,"
  [ -z "$malos" ] && ok D7 "convencional, bilingüe, cuerpo y sin IA" \
                 || falla D7 "${malos%,}"
  return 0
}

# D4 · referencias colgantes a las rutas paralelas (MAPA.md §5.1 punto 8).
# UMBRAL 33 = el recuento real de HEAD medido con este mismo comando (33
# líneas en 16 archivos: Pie, MenuHoja, CarritoHoja, Encabezado, Tarjeta,
# Carcasa, Portada, Mostrador, Populares, tailwind.css, los tres entry
# paralelos, el test de Tarjeta y las 3 líneas de vite.config.js).
# No es 5, como decía el encargo: 5 era solo Carcasa + vite.config.js.
# La migración está a mitad, así que por debajo del umbral es AVISO y el
# umbral BAJA a mano en 1.7, 2.1, 2.5 y 4.6. Falla solo si el número CRECE:
# una referencia nueva es siempre un error.
d4() {
  local ref n
  ref=$(rg -n "landing\.html|catalogo\.html|panel\.html" \
        --glob '!docs/**' --glob '!node_modules/**' --glob '!dist/**' . 2>/dev/null || true)
  n=$(printf '%s\n' "$ref" | rg -c '.' || true); n=${n:-0}
  [ "$n" -le 33 ] && ok D4 "$n/33 referencias a rutas paralelas" \
                  || { falla D4 "$n referencias colgantes (máx. 33)"; printf '%s\n' "$ref" | head -5 | sed 's/^/        /'; }
  return 0
}

# D5 · una sola de cada cosa (MAPA.md §5.1 punto 9 y §2a). Cada concepto debe
# vivir en un SOLO archivo. Tres filtros para que la lista sea legible y sea
# de verdad una lista de trabajo:
#   1. las búsquedas van ancladas a la DEFINICIÓN, no al uso: que ocho archivos
#      importen Tarjeta no es un duplicado; tener dos Tarjetas sí;
#   2. se descartan los archivos de estilo (styles.* guardan tokens de
#      styled-components, no componentes: G2 ya los prohíbe);
#   3. se descartan las coincidencias que caen en un comentario: hoy
#      src/ui/assetUrl.ts:6-7, js/modules/core/api.js:42 y
#      src/entry/shared.tsx:114 nombran VITE_SUPABASE_* solo en prosa.
# Se excluyen __tests__: una prueba delata al duplicado, no lo crea.
# DUPLICADOS CONOCIDOS (MAPA.md §2a) y el paso que los mata:
#   a) src/ui/Tarjeta.tsx + src/components/ProductCard/ProductCard.tsx → 2.5
#   b) src/data/catalogo.ts + src/entry/shared.tsx (fetchProducts) → 2.1
#   c) src/data/supabase.ts + js/modules/supabase.js + src/redux/slices/
#      busquedaSlice.ts + js/modules/chatbot.js:146 (este cuarto lector NO
#      está en §2a: lo encontró esta compuerta) → 6
#   d) src/ui/assetUrl.ts + el assetUrl de src/entry/shared.tsx:19 → 2.1
#   e) src/ui/Hoja.tsx, sola (la Lupa se apoya en ella desde 1.1)
# UMBRALES = número de archivos LEGÍTIMOS hoy. Cuando la vieja muera en su
# paso, el umbral baja a 1 y la compuerta avisa del cambio.
d5concepto() {
  # OJO: bash 3.2 de macOS vacía un `local nombre` sin asignación, así que los
  # argumentos se copian con `=`. Es lo que ya hace chk() más arriba.
  local id="$1" nombre="$2" pat="$3" umbral="$4" lista="" n=0
  lista=$(rg -n "$pat" -g '!**/__tests__/**' -g '!**/styles.*' src js 2>/dev/null \
          | rg -v '^[^:]+:[0-9]+:\s*(//|\*|/\*|<!--)' | cut -d: -f1 | sort -u || true)
  n=$(printf '%s\n' "$lista" | rg -c '.' || true); n=${n:-0}
  [ "$n" -le "$umbral" ] && ok D5 "$id $nombre $n/$umbral" \
                         || { falla D5 "$id $nombre: $n archivos (máx. $umbral)"; printf '%s\n' "$lista" | sed 's/^/        /'; }
  return 0
}
d5() {
  d5concepto a "tarjeta de producto" '(function|const)[ ]+(Tarjeta|ProductCard)\b' 2
  d5concepto b "cargador de catálogo" '(export (async )?function|const)[ ]*(fetchProducts|cargarCatalogo|fetchCategories)\b' 1
  d5concepto c "cliente Supabase" 'createClient\(|VITE_SUPABASE_(URL|ANON_KEY|KEY)' 3
  d5concepto d "assetUrl" 'export (function|const) assetUrl' 1
  d5concepto e "sistema de superposición" 'showModal\(' 1
  return 0
}

# D6 · ninguna superposición sin X (MAPA.md §5.1 punto 10, Batería B3): cada
# ventana, menú, cajón o diálogo usa la Hoja común (src/ui/Hoja.tsx, con X,
# Escape, fondo y foco devuelto) o lleva X con aria-label.
# Hoy la única superposición propia es src/components/Lupa/Lupa.tsx (581
# líneas, su propia trampa de foco :261-321): es AVISO, porque el paso 1.1 la
# restila y la monta en el Encabezado usando Hoja. No cuenta como falla.
d6() {
  local viols=0 detalle=""
  for f in $(rg -ln 'role="dialog"|<dialog' -g '!**/__tests__/**' src js 2>/dev/null | sort); do
    [ "$f" = src/ui/Hoja.tsx ] && continue
    if [ "$f" = src/components/Lupa/Lupa.tsx ]; then
      detalle="$detalle Lupa(propia,AVISO: la mueve el paso 1.1),"
    elif rg -q 'aria-label' "$f" 2>/dev/null; then
      detalle="$detalle $f(con-X),"
    else
      viols=$((viols+1)); detalle="$detalle $f(SIN-X),"
    fi
  done
  [ "$viols" = 0 ] && ok D6 "ninguna sin X: ${detalle%,}" \
                  || falla D6 "$viols superposición(es) sin X: ${detalle%,}"
  return 0
}

if [ "$1" = "--rapido" ]; then
  echo "== Anti-duplicado D (rápido: D1, D2, D3, D7)"
  d1; d2; d3; d7
else
  echo "== Anti-duplicado D (completo: D1 a D7)"
  d1; d2; d3; d4; d5; d6; d7
fi

echo "== Archivos fuera de lista (excluye lo ajeno)"
git status --porcelain --untracked-files=all | rg -v '\.atl/skill-registry.md|docs/design/loop-final.md|docs/design/loop-v3.md|docs/design/mockups/|docs/design/rediseno/(ESTADO|capturas-r4)' | sed 's/^/  · /' | head -40

echo; [ "$fallas" = 0 ] && echo "COMPUERTAS: VERDE" || { echo "COMPUERTAS: $fallas FALLAS"; exit 1; }
