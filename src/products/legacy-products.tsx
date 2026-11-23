/**
 * The static products.html at the root of the repo, served by the Vite dev server. The Django
 * page (backend/ventas/templates/ventas/productos.html) does not run this: it paints the catalogue
 * itself from the real database and mounts only what it needs (src/products/server-products.ts).
 */
import '../../js/modules/ui/bootstrap-global.js';
import { useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { Lupa } from '@src/components/Lupa/Lupa';
import { usePedido } from '@src/hooks/usePedido';
import { CarrilCategorias } from '@src/components/CarrilCategorias/CarrilCategorias';
import { CartPanel } from '@src/components/CartPanel/CartPanel';
import { ProductList } from '@src/components/ProductList/ProductList';
import { SEED_PRODUCTS } from '@src/data/seedProducts';
import type { CartLegacyItem, OrderLine, Product } from '@src/types/database';
import { HashRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductoDetalle } from '@src/pages/ProductoDetalle';
import { Carrito } from '@src/pages/Carrito';
import { fetchProducts, mountReactNode, categoryLabel, categorySlugOf } from '@src/entry/shared';
import { carniTheme } from '@src/theme/carniTheme';
import { store } from '@src/redux/store';
import GlobalStyles from '@src/styles/globalStyles';
import '@src/styles/redesign.css';

const LEGACY_CART_KEY = 'carni_cart_v1';

/**
 * Reads whatever is already in the shared cart key and turns it into order
 * lines.
 *
 * Two writers share `carni_cart_v1`: this file and the vanilla
 * js/modules/core/cart.js. (A third, src/hooks/useCart.ts, was deleted on
 * 2026-09-02 — it had zero importers.) The order used to mount empty and immediately
 * overwrite the key, so a cart filled on index.html was destroyed the moment the
 * customer opened the catalogue — and a plain refresh lost it too.
 *
 * The legacy item carries fields this model has no place for (grosor, basePeso, the orderMode
 * quote inputs), so each one is kept as read on `OrderLine.legacy`. Nothing in this file writes
 * the key back: the store subscription in src/redux/store.ts does.
 */
function readLegacyCart(): OrderLine[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_CART_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartLegacyItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item, index) => {
      const unit: OrderLine['unit'] =
        item.tipo === 'unidad' || item.tipo === 'paquete' ? item.tipo : 'kg';

      // Read the field that matches the unit. A piece-priced line stores
      // `peso: 0`, and `??` only falls through on null/undefined — never on 0 —
      // so reading `peso ?? piezas` gave a quantity of 0 and billed the whole
      // line at $0.00 after a refresh.
      const stored = unit === 'kg' ? item.peso : item.piezas;

      // The vanilla catalogue stores string slugs ('bisteck_res'), so Number()
      // yielded NaN — and JSON.stringify writes NaN as null, wiping the id of
      // every line in a returning customer's cart. Only convert what is
      // actually numeric; keep the original otherwise.
      const numericId = typeof item.id === 'number' ? item.id : Number(item.id);
      const productId = Number.isFinite(numericId) ? numericId : item.id;

      return {
        lineId: `${item.id}-restored-${index}`,
        productId,
        name: item.name,
        pricePerKg: item.price,
        quantity: stored && stored > 0 ? stored : 1,
        image: item.img ?? '/img/products/res.png',
        categorySlug: item.categoria ?? 'res',
        unit,
        // Carried untouched: the fields React never models stay as they were read.
        legacy: item
      };
    });
  } catch {
    return [];
  }
}

/**
 * Slugs that changed meaning when the catalogue moved to the seed.
 *
 * The bento tiles on index.html and the drawer chips still link to
 * `products.html?categoria=<slug>` using the vanilla slugs. `premium` pointed at
 * Selección Premium, which was retired in favour of Cortes Especiales, so the
 * old link keeps working instead of silently landing on the full catalogue.
 */
const SLUG_ALIASES: Record<string, string> = {
  premium: 'cortes-especiales',
  res: 'carnes-rojas'
};

/**
 * Resolves `?categoria=<slug>` to the chip label for that category.
 *
 * The chips are labelled with category names while the links carry slugs, so the
 * two are matched through the products themselves rather than a hand-written
 * table that would drift from the seed.
 */
function filterFromUrl(products: Product[], slugExplicito?: string | null): string | null {
  // Two places can carry the category, and both are legitimate.
  //
  // The bento tiles on index.html link to `products.html?categoria=<slug>` — a
  // real query string, because they are plain anchors leaving one HTML page for
  // another. Inside the catalogue the router is a HashRouter, so its own links
  // put the query after the `#` and `window.location.search` comes back empty.
  // Reading only the search string made the "back to Cortes Especiales" link
  // navigate and then show all 53 products.
  const raw = slugExplicito ?? new URLSearchParams(window.location.search).get('categoria');
  if (!raw) {
    return null;
  }

  const wanted = SLUG_ALIASES[raw] ?? raw;
  const match = products.find((product) => categorySlugOf(product) === wanted);

  return match ? categoryLabel(match) : null;
}

function CatalogExperience(): JSX.Element {
  /**
   * The grid starts EMPTY and shows a skeleton, not the seed.
   *
   * It used to mount straight into SEED_PRODUCTS. That painted 33 hand-written
   * products — "Ribeye", "T-Bone", names that do not exist in Supabase — and a
   * moment later swapped them for the 53 real ones. Different count, different
   * names, different height: that is the flash, and it is worse than a flicker,
   * because for an instant the customer is looking at products the shop does not
   * sell.
   *
   * The seed still earns its place, but as what it was meant to be: the floor
   * under a request that never answers. It lands on timeout, not on first paint.
   */
  const [products, setProducts] = useState<Product[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  // Hydrated from the shared cart key. Only the setter is used: the listener below re-renders
  // the page when another writer touches that key.
  const [, setOrder] = useState<OrderLine[]>(() => readLegacyCart());
  // The nine bento tiles on index.html and the drawer chips deep-link into a
  // category, so the filter is resolved from the URL during the first render
  // rather than after a round trip.
  const [parametros] = useSearchParams();
  const slugPedido = parametros.get('categoria');
  const [activeFilter, setActiveFilter] = useState<string>(
    () => filterFromUrl(SEED_PRODUCTS, slugPedido) ?? 'all'
  );
  /**
   * The live filter of the magnifier.
   *
   * It arrives as `?q=`, a REAL query string before the `#`, because the landing and the access
   * page have no router and can only send the customer here with a plain link. That is why it is
   * read from `window.location.search` and not from the HashRouter's `useSearchParams`, which only
   * sees what comes after the `#`.
   */
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    try {
      return new URLSearchParams(window.location.search).get('q') ?? '';
    } catch {
      return '';
    }
  });

  // Coming back from a product page is a route change, not a mount: the filter
  // was resolved once in the useState initializer and never looked again, so
  // returning to a category left the chip on "Todo el catálogo".
  useEffect(() => {
    if (!slugPedido) {
      return;
    }
    const etiqueta = filterFromUrl(products, slugPedido);
    if (etiqueta) {
      setActiveFilter(etiqueta);
    }
  }, [slugPedido, products]);

  useEffect(() => {
    void fetchProducts()
      .then(({ products: loaded, live }) => {
        // `fetchProducts` already falls back to the seed when the request times
        // out, so `loaded` is never empty. What `live` says is whether these are
        // the real ones — and either way they are what the customer gets, so
        // both go on screen. Returning early here was what kept the seed
        // visible.
        setProducts(loaded);

        const fromUrl = filterFromUrl(loaded, slugPedido);
        if (fromUrl) {
          setActiveFilter(fromUrl);
        }
      })
      .finally(() => {
        // In `finally`, never inside the success branch: a rejected request
        // would leave the skeleton shimmering forever with no way out.
        setCargando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
    There used to be a second writer on `carni_cart_v1` here.

    It wrote from the local `order` state, which does not hear about removals from the store:
    removing a line did not change `order`, so this effect never ran and the disk kept the line.
    Now the disk is an effect of the store subscription (src/redux/store.ts), which covers ALL
    actions. Two writers on the same key are a recipe for stepping on each other one day.
  */

  // Rehydrates the order when another writer touches the shared key: the
  // premium modal on products.html persists through cart.js, which fires
  // 'cart:updated', and other tabs fire 'storage'. Without this listener the
  // next "Agregar" overwrote whatever the modal had added.
  useEffect(() => {
    const rehydrate = (): void => {
      setOrder(readLegacyCart());
    };

    window.addEventListener('storage', rehydrate);
    window.addEventListener('cart:updated', rehydrate as EventListener);

    return () => {
      window.removeEventListener('storage', rehydrate);
      window.removeEventListener('cart:updated', rehydrate as EventListener);
    };
  }, []);

  // The cart button lives in the static header, outside this tree, so it is
  // bound in usePedido now, which owns the drawer for every route.

  const filters = useMemo(() => {
    const labels = new Set<string>();
    products.forEach((product) => labels.add(categoryLabel(product)));
    return ['all', ...Array.from(labels)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const termino = searchTerm.trim().toLowerCase();
    const porCategoria =
      activeFilter === 'all'
        ? products
        : products.filter((product) => categoryLabel(product) === activeFilter);

    if (termino.length === 0) {
      return porCategoria;
    }

    return porCategoria.filter((product) =>
      `${product.name} ${product.description ?? ''}`.toLowerCase().includes(termino)
    );
  }, [activeFilter, products, searchTerm]);

  return (
    <section className="tw-redesign-root tw-catalog-shell">
      <div className="tw-catalog-shell__header">
        <p className="tw-kicker">Catálogo Maestro</p>
        <h2>Elige tu corte, compara opciones y arma tu pedido sin perder tiempo</h2>
        <p>
          Aquí reunimos los productos más buscados de la carnicería para que cualquier cliente pueda
          encontrar res, pollo, cerdo y especiales con una navegación clara y directa.
        </p>
        <CarrilCategorias
          filtros={filters}
          activo={activeFilter}
          onElegir={setActiveFilter}
          etiqueta={(f) => (f === 'all' ? 'Todo el catálogo' : f)}
        />
        {searchTerm.trim().length > 0 ? (
          <p className="tw-filter-row__hint">
            Buscando: <strong>{searchTerm}</strong>{' '}
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                // The filter must not come back on reload: clear ?q= as well, keeping the
                // hash so the customer stays on their route.
                history.replaceState(null, '', `products.html${window.location.hash}`);
              }}
            >
              Limpiar búsqueda
            </button>
          </p>
        ) : null}
      </div>

      <ProductList products={filteredProducts} cargando={cargando} />

    </section>
  );
}

/**
 * The drawer sits OUTSIDE `<Routes>` on purpose.
 *
 * Inside, it would unmount and remount on every navigation — and it only existed
 * on the catalogue route at all, so opening a product left the cart button with
 * nothing to open. Out here it survives the route change: the customer can
 * configure a cut, add it, and the ticket is still there.
 */
function CarritoGlobal(): JSX.Element {
  const pedido = usePedido({ leer: readLegacyCart });

  return (
    <CartPanel
      isOpen={pedido.abierto}
      onClose={pedido.cerrar}
      onRemove={pedido.quitar}
      order={pedido.lineas}
      total={pedido.total}
    />
  );
}

/**
 * On the catalogue a result routes in place; nothing reloads.
 */
function LupaConRuta(): JSX.Element {
  const navegar = useNavigate();
  return <Lupa onPickProduct={(producto) => navegar(`/producto/${producto.id}`)} />;
}

/**
 * The router, and why it hashes.
 *
 * Carni-mvp is not a single-page app: it is a set of HTML pages with React
 * islands mounted into them. This router lives *inside* the catalogue island
 * only — index.html, accessweb.html and the admin pages never see it.
 *
 * `HashRouter`, not `BrowserRouter`, and that is deliberate. The site ships to
 * two hosts that serve from different roots: Netlify from `/`, GitHub Pages from
 * `/Landingpages-Carni.pwa/`. A path router would need a matching `basename` on
 * each, plus a server rewrite so that `/producto/12` — a URL with no file behind
 * it — does not 404. Both live sites are healthy today, and a rewrite rule is
 * exactly what broke them once before: `force = true` in netlify.toml made every
 * asset come back as index.html.
 *
 * A hash never reaches the server. `products.html#/producto/12` is a request for
 * `products.html` on any host, under any base, with no configuration at all.
 * The route, `useParams` and `<Link>` work identically either way.
 */
function CatalogoConRutas(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CatalogExperience />} />
        <Route path="/producto/:id" element={<ProductoDetalle />} />
        {/* The order has an address of its own, besides the drawer. The drawer lives outside
            `<Routes>` precisely to survive route changes; this page is the opposite: the same
            list, but with a URL, so it can be reloaded, shared or come back to. Both read from
            the same store, so there are not two orders, there are two views. */}
        <Route path="/carrito" element={<Carrito />} />
      </Routes>
      <CarritoGlobal />
      <LupaConRuta />
    </HashRouter>
  );
}

export function mountLegacyCatalog(): void {
  mountReactNode(
    '#productsReactRoot',
    <Provider store={store}>
      <ThemeProvider theme={carniTheme}>
        <GlobalStyles />
        <CatalogoConRutas />
      </ThemeProvider>
    </Provider>
  );
}
