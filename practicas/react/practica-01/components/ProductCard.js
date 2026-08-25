import React from 'react';

class ProductCard extends React.Component {
  render() {
    const { nombre, precio_kg, stock, estado } = this.props;

    const statusLabel = {
      active: { text: 'Disponible', className: 'status--active' },
      low_stock: { text: 'Stock bajo', className: 'status--low' },
      inactive: { text: 'Inactivo', className: 'status--inactive' },
    };

    const status = statusLabel[estado] || statusLabel.inactive;

    return React.createElement(
      'article',
      { className: 'product-card' },
      React.createElement(
        'div',
        { className: 'product-card__header' },
        React.createElement('span', { className: 'product-card__emoji' }, '🥩'),
        React.createElement(
          'span',
          { className: `product-card__status ${status.className}` },
          status.text
        )
      ),
      React.createElement(
        'h2',
        { className: 'product-card__name' },
        nombre
      ),
      React.createElement(
        'div',
        { className: 'product-card__details' },
        React.createElement(
          'div',
          { className: 'product-card__detail' },
          React.createElement('span', { className: 'detail-label' }, 'Precio / kg'),
          React.createElement(
            'span',
            { className: 'detail-value detail-value--price' },
            `$${precio_kg.toLocaleString('es-MX')} MXN`
          )
        ),
        React.createElement(
          'div',
          { className: 'product-card__detail' },
          React.createElement('span', { className: 'detail-label' }, 'Stock'),
          React.createElement(
            'span',
            {
              className: `detail-value ${stock <= 5 ? 'detail-value--low' : ''}`,
            },
            `${stock} kg`
          )
        )
      )
    );
  }
}

export default ProductCard;
