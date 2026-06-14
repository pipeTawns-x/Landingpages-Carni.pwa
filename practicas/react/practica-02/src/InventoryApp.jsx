import { useState, useEffect } from 'react';
import InventoryHeader from './components/InventoryHeader';
import ProductCard from './components/ProductCard';
import AddProductForm from './components/AddProductForm';
import { SEED_PRODUCTS } from './types/carni';
import '../styles.css';

const STORAGE_KEY = 'carni-products';

function InventoryApp() {
  // Initialize from localStorage — simulate Supabase persistence
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : SEED_PRODUCTS;
    } catch {
      return SEED_PRODUCTS;
    }
  });

  const [flashOffers, setFlashOffers] = useState(new Set());
  const [showForm, setShowForm] = useState(false);

  // Sync products to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  // Log flash offer changes (simulates BuildAds trigger)
  useEffect(() => {
    if (flashOffers.size > 0) {
      console.log(
        '[BuildAds] Ofertas relámpago activas:',
        [...flashOffers].map((id) => products.find((p) => p.id === id)?.nombre)
      );
    }
  }, [flashOffers, products]);

  function handleAddProduct(newProduct) {
    // Immutable update — spread, never push
    setProducts((prev) => [...prev, newProduct]);
  }

  function handleToggleFlash(productId) {
    setFlashOffers((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  return (
    <main className="inventory-shell">
      <InventoryHeader
        totalProductos={products.length}
        flashOfferCount={flashOffers.size}
      />

      <div className="inventory-toolbar">
        <button
          className="btn-toggle-form"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? '✕ Cerrar formulario' : '+ Agregar producto'}
        </button>
      </div>

      {showForm && <AddProductForm onAdd={handleAddProduct} />}

      {flashOffers.size > 0 && (
        <section className="flash-banner">
          <h3 className="flash-banner__title">⚡ Ofertas relámpago activas</h3>
          <ul className="flash-banner__list">
            {[...flashOffers].map((id) => {
              const p = products.find((x) => x.id === id);
              return p ? (
                <li key={id} className="flash-banner__item">
                  {p.nombre} — ${p.precio_kg.toLocaleString('es-MX')}/kg
                </li>
              ) : null;
            })}
          </ul>
          <p className="flash-banner__note">
            → BuildAds recibirá estas ofertas para generar creativos automáticamente
          </p>
        </section>
      )}

      <section className="inventory-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFlashOffer={flashOffers.has(product.id)}
            onToggleFlash={handleToggleFlash}
          />
        ))}
      </section>
    </main>
  );
}

export default InventoryApp;
