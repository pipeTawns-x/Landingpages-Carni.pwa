import { useEffect, useState } from 'react';
import { BuildAdsOrchestrator } from '@src/modules/buildads/BuildAdsOrchestrator';
import type { Product } from '@src/types/database';
import { fetchProducts, mountReactNode } from './shared';
import '@src/styles/redesign.css';

function DashboardStudio(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    void fetchProducts().then((items) => setProducts(items.slice(0, 10)));
  }, []);

  return (
    <section className="tw-redesign-root tw-admin-ribbon">
      <div className="tw-admin-ribbon__content">
        <p className="tw-kicker">Executive Control</p>
        <h2>Dashboard Matrix con operaciones, promociones y agencia creativa</h2>
        <p>
          El panel principal evoluciona a un centro operativo con BuildAds, estado de catálogo, agenda comercial
          y contexto para promociones con aprobación humana.
        </p>
        <div className="tw-admin-ribbon__grid">
          <article className="tw-mini-card">
            <h3>Control de inventario</h3>
            <p>Vincula campañas solo a productos activos con stock disponible.</p>
          </article>
          <article className="tw-mini-card">
            <h3>Agenda inteligente</h3>
            <p>Programa activaciones para web, Meta, TikTok y WhatsApp desde un mismo flujo.</p>
          </article>
        </div>
      </div>
      <BuildAdsOrchestrator products={products} />
    </section>
  );
}

mountReactNode('#buildAdsReactRoot', <DashboardStudio />);
