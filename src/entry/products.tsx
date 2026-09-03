import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartPanel } from '@src/components/CartPanel/CartPanel';
import { ProductList } from '@src/components/ProductList/ProductList';
import { SEED_PRODUCTS } from '@src/data/seedProducts';
import type { CartLegacyItem, OrderLine, Product } from '@src/types/database';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ProductoDetalle } from '@src/pages/ProductoDetalle';
import { fetchProducts, mountReactNode, categoryLabel, categorySlugOf, assetUrl } from './shared';
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
 * Hydrating here makes the write below non-empty. It does not by itself make it
 * non-destructive: the legacy item carries fields this model has no place for,
 * so each one is kept on `OrderLine.legacy` and merged back in syncLegacyCart.
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
        // Carried untouched so syncLegacyCart can merge the fields React never
        // models — grosor, basePeso, the orderMode quote inputs — instead of
        // rebuilding the legacy shape and dropping them.
        legacy: item
      };
    });
  } catch {
    return [];
  }
}

// Set only while syncLegacyCart dispatches: dispatchEvent is synchronous, so
// this component's own 'cart:updated' reaches the rehydrate listener with the
// flag up and is ignored. External writers — the premium modal via cart.js —
// dispatch without it, and those events do rehydrate the order. This is what
// keeps the write effect and the listener from chasing each other.
let isSyncingLegacyCart = false;

/**
 * Mirrors the order into the storage key the vanilla cart already uses, and
 * dispatches 'cart:updated' so its listeners — the header badge in cart.js —
 * react.
 *
 * React owns the order now. This write exists so the rest of the site — the
 * badge, the checkout in js/modules/core/cart.js — keeps seeing the same data
 * it always did, rather than being cut off mid-migration.
 *
 * It merges over the item each line was restored from rather than rebuilding
 * the legacy shape, because cart.js reads fields React never models.
 */
function syncLegacyCart(order: OrderLine[]): void {
  const legacyItems = order.map((line) => {
    // Start from the item this line was restored from, so the fields React does
    // not model survive the round trip. Rebuilding the object from scratch
    // dropped grosor, basePeso and the orderMode quote inputs, and cart.js
    // reads all of them — a premium cut came back as a plain kg line.
    const original: Partial<CartLegacyItem> = line.legacy ?? {};

    return {
      ...original,
      id: line.productId,
      name: line.name,
      price: line.pricePerKg,
      img: line.image,
      // Was hardcoded to 'kg', which mislabelled every cap and bundle. A line
      // restored as 'corte' keeps that type: isPremiumCutItem() in cart.js
      // gates the thickness slider on it, and OrderLine.unit has no 'corte'.
      tipo: original.tipo === 'corte' ? 'corte' : line.unit,
      peso: line.unit === 'kg' ? line.quantity : 0,
      piezas: line.unit === 'kg' ? 0 : line.quantity,
      categoria: line.categorySlug
    };
  });

  window.localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(legacyItems));

  // cart.js listens for this event and repaints the header badge itself —
  // poking the DOM from here duplicated that job and counted lines, not
  // pieces. The flag keeps our own listener from reacting to our own write.
  isSyncingLegacyCart = true;
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: legacyItems.length } }));
  isSyncingLegacyCart = false;
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
function filterFromUrl(products: Product[]): string | null {
  const raw = new URLSearchParams(window.location.search).get('categoria');
  if (!raw) {
    return null;
  }

  const wanted = SLUG_ALIASES[raw] ?? raw;
  const match = products.find((product) => categorySlugOf(product) === wanted);

  return match ? categoryLabel(match) : null;
}

let lineCounter = 0;

/**
 * A unique id for an order line.
 *
 * `crypto.randomUUID` only exists in a secure context, so it is undefined when
 * the site is served over plain HTTP from anything other than localhost — which
 * is exactly how this MVP gets demoed on a phone over the local network. The
 * counter is the fallback; uniqueness within one page is all a React key needs.
 */
function nextLineId(productId: number): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  lineCounter += 1;
  return uuid ? `${productId}-${uuid}` : `${productId}-${lineCounter}`;
}

function toOrderLine(product: Product): OrderLine {
  const slug = (Array.isArray(product.categories)
    ? product.categories[0]?.slug
    : product.categories?.slug) ?? 'res';

  return {
    // The same product can be ordered more than once, so the line needs an
    // identity of its own; the product id alone would collide as a React key.
    lineId: nextLineId(product.id),
    productId: product.id,
    name: product.name,
    pricePerKg: product.price_per_kg,
    quantity: 1,
    image: assetUrl((product.image_url ?? '/img/products/res.webp').replace(/\.webp$/i, '.png')),
    categorySlug: slug,
    // Merchandising is priced per piece and the Ofertas bundles per package.
    // Matches ProductCard.priceUnit(), which decides the same thing for display.
    unit: slug === 'merch' ? 'unidad' : slug === 'ofertas' && !product.price_per_lb ? 'paquete' : 'kg'
  };
}

function CatalogExperience(): JSX.Element {
  // Starts from the seed so the grid paints on the very first render. It used to
  // start empty and wait for Supabase, which on an unreachable host meant 7.4
  // seconds of blank page before a single card appeared.
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  // Hydrated from the shared cart key. Mounting empty and then writing through
  // to that key is what used to wipe a cart filled elsewhere on the site.
  const [order, setOrder] = useState<OrderLine[]>(() => readLegacyCart());
  // The nine bento tiles on index.html and the drawer chips deep-link into a
  // category, so the filter is resolved from the URL during the first render
  // rather than after a round trip.
  const [activeFilter, setActiveFilter] = useState<string>(
    () => filterFromUrl(SEED_PRODUCTS) ?? 'all'
  );
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    void fetchProducts().then(({ products: loaded, live }) => {
      // The seed is already on screen; only a real response is worth a re-render.
      if (!live) {
        return;
      }

      setProducts(loaded);

      const fromUrl = filterFromUrl(loaded);
      if (fromUrl) {
        setActiveFilter(fromUrl);
      }
    });
  }, []);

  // Runs on every change to the order, including the first render and the
  // change that empties it. Intentionally not guarded by a condition.
  // Kept for EBAC activity 6.28.9 — remove before a production release.
  useEffect(() => {
    console.log('Pedido actualizado:', order);
  }, [order]);

  useEffect(() => {
    syncLegacyCart(order);
  }, [order]);

  // Rehydrates the order when another writer touches the shared key: the
  // premium modal on products.html persists through cart.js, which fires
  // 'cart:updated', and other tabs fire 'storage'. Without this listener the
  // next "Agregar" overwrote whatever the modal had added. The flag inside
  // syncLegacyCart keeps this effect from re-firing on our own writes.
  useEffect(() => {
    const rehydrate = (): void => {
      if (isSyncingLegacyCart) {
        return;
      }
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
  // bound here instead of through a React prop.
  useEffect(() => {
    const cartButton = document.getElementById('cartBtn');
    if (!cartButton) {
      return;
    }

    const toggle = (event: Event): void => {
      event.preventDefault();
      setIsCartOpen((open) => !open);
    };

    const openSideCart = (): void => {
      setIsCartOpen(true);
    };

    const closeSideCart = (): void => {
      setIsCartOpen(false);
    };

    cartButton.addEventListener('click', toggle);
    window.addEventListener('cart:open', openSideCart);
    window.addEventListener('cart:close', closeSideCart);

    return () => {
      cartButton.removeEventListener('click', toggle);
      window.removeEventListener('cart:open', openSideCart);
      window.removeEventListener('cart:close', closeSideCart);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('cart-is-open', isCartOpen);
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
    document.body.style.touchAction = isCartOpen ? 'none' : '';
  }, [isCartOpen]);

  const filters = useMemo(() => {
    const labels = new Set<string>();
    products.forEach((product) => labels.add(categoryLabel(product)));
    return ['all', ...Array.from(labels)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') {
      return products;
    }

    return products.filter((product) => categoryLabel(product) === activeFilter);
  }, [activeFilter, products]);

  const total = useMemo(() => {
    return order.reduce((sum, line) => sum + line.pricePerKg * line.quantity, 0);
  }, [order]);

  const handleAddToOrder = useCallback((product: Product): void => {
    setOrder((current) => [...current, toOrderLine(product)]);
    setIsCartOpen(true);
  }, []);

  const handleRemove = useCallback((lineId: string): void => {
    setOrder((current) => current.filter((line) => line.lineId !== lineId));
  }, []);

  const handleClose = useCallback((): void => {
    setIsCartOpen(false);
  }, []);

  return (
    <section className="tw-redesign-root tw-catalog-shell">
      <div className="tw-catalog-shell__header">
        <p className="tw-kicker">Catálogo Maestro</p>
        <h2>Elige tu corte, compara opciones y arma tu pedido sin perder tiempo</h2>
        <p>
          Aquí reunimos los productos más buscados de la carnicería para que cualquier cliente pueda
          encontrar res, pollo, cerdo y especiales con una navegación clara y directa.
        </p>
        <div className="tw-filter-row">
          {filters.map((filter) => (
            <button
              className={`tw-filter-chip ${activeFilter === filter ? 'tw-filter-chip--active' : ''}`}
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'all' ? 'Todo el catálogo' : filter}
            </button>
          ))}
        </div>
      </div>

      <ProductList products={filteredProducts} onAddToOrder={handleAddToOrder} />

      <CartPanel
        isOpen={isCartOpen}
        onClose={handleClose}
        onRemove={handleRemove}
        order={order}
        total={total}
      />
    </section>
  );
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
      </Routes>
    </HashRouter>
  );
}

mountReactNode('#productsReactRoot', <CatalogoConRutas />);
