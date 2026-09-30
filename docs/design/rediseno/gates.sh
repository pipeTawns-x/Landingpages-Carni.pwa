#!/bin/bash
# Compuertas mecánicas de las unidades del rediseño (06-plano.md §4.0).
# Uso: docs/design/rediseno/gates.sh [--rapido]   (--rapido salta ts:check/test/build)
# Sale con código 1 si alguna compuerta rg falla o si algo de Docker falla.
WT=/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas
cd "$WT" || exit 1
fallas=0
ok()   { printf "  ✓ %-4s %s\n" "$1" "$2"; }
falla(){ printf "  ✗ %-4s %s\n" "$1" "$2"; fallas=$((fallas+1)); }

test "$(git branch --show-current)" = pruebas || { echo "rama equivocada"; exit 1; }
docker start carni-landing-dev >/dev/null 2>&1

echo "== HTTP"
for p in landing catalogo panel; do
  c=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/$p.html")
  [ "$c" = 200 ] && ok "$p" "200" || echo "  · $p $c (esperado 404 hasta que su unidad lo cree)"
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

echo "== Archivos fuera de lista (excluye lo ajeno)"
git status --porcelain --untracked-files=all | rg -v '\.atl/skill-registry.md|docs/design/loop-final.md|docs/design/loop-v3.md|docs/design/mockups/|docs/design/rediseno/(ESTADO|capturas-r4)' | sed 's/^/  · /' | head -40

echo; [ "$fallas" = 0 ] && echo "COMPUERTAS: VERDE" || { echo "COMPUERTAS: $fallas FALLAS"; exit 1; }
