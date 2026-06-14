function ProductCard({ product, isFlashOffer, onToggleFlash }) {
  const { id, nombre, precio_kg, stock, categoria, estado } = product;

  const statusMap = {
    active: { text: 'Disponible', cls: 'status--active' },
    low_stock: { text: 'Stock bajo', cls: 'status--low' },
    inactive: { text: 'Inactivo', cls: 'status--inactive' },
  };
  const status = statusMap[estado] || statusMap.inactive;

  return (
    <article className={`product-card ${isFlashOffer ? 'product-card--flash' : ''}`}>
      <div className="product-card__header">
        <span className="product-card__emoji">🥩</span>
        <span className={`product-card__status ${status.cls}`}>{status.text}</span>
      </div>

      <h2 className="product-card__name">{nombre}</h2>
      <p className="product-card__category">{categoria}</p>

      <div className="product-card__details">
        <div className="product-card__detail">
          <span className="detail-label">Precio / kg</span>
          <span className="detail-value detail-value--price">
            ${precio_kg.toLocaleString('es-MX')} MXN
          </span>
        </div>
        <div className="product-card__detail">
          <span className="detail-label">Stock</span>
          <span className={`detail-value ${stock <= 5 ? 'detail-value--low' : ''}`}>
            {stock} kg
          </span>
        </div>
      </div>

      <button
        className={`btn-flash ${isFlashOffer ? 'btn-flash--active' : ''}`}
        onClick={() => onToggleFlash(id)}
        aria-pressed={isFlashOffer}
      >
        {isFlashOffer ? '⚡ Oferta activa' : '⚡ Marcar oferta relámpago'}
      </button>
    </article>
  );
}

export default ProductCard;
