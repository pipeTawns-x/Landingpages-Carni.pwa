import React from 'react';

class InventoryHeader extends React.Component {
  render() {
    const { totalProductos } = this.props;

    return React.createElement(
      'header',
      { className: 'inventory-header' },
      React.createElement(
        'div',
        { className: 'inventory-header__brand' },
        React.createElement('span', { className: 'inventory-header__icon' }, '🥩'),
        React.createElement(
          'h1',
          { className: 'inventory-header__title' },
          'Panel de Control: Inventario de Cortes'
        )
      ),
      React.createElement(
        'div',
        { className: 'inventory-header__badge' },
        React.createElement('span', { className: 'badge' }, totalProductos),
        React.createElement('span', { className: 'badge-label' }, 'Productos activos')
      )
    );
  }
}

export default InventoryHeader;
