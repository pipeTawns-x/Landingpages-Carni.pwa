function InventoryHeader({ totalProductos, flashOfferCount }) {
  return (
    <header className="inventory-header">
      <div className="inventory-header__brand">
        <span className="inventory-header__icon">🥩</span>
        <h1 className="inventory-header__title">Gestor de Inventario — Carni-mvp</h1>
      </div>
      <div className="inventory-header__stats">
        <div className="stat">
          <span className="stat-value">{totalProductos}</span>
          <span className="stat-label">Productos</span>
        </div>
        {flashOfferCount > 0 && (
          <div className="stat stat--flash">
            <span className="stat-value">⚡ {flashOfferCount}</span>
            <span className="stat-label">Ofertas activas</span>
          </div>
        )}
      </div>
    </header>
  );
}

export default InventoryHeader;
