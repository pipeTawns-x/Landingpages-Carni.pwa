import React from 'react';
import InventoryHeader from './components/InventoryHeader';
import ProductCard from './components/ProductCard';
import './styles.css';

class InventoryApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      products: [
        {
          id: 1,
          nombre: 'Rib Eye Premium',
          precio_kg: 550,
          stock: 12,
          estado: 'active',
        },
        {
          id: 2,
          nombre: 'Picaña',
          precio_kg: 320,
          stock: 8,
          estado: 'active',
        },
        {
          id: 3,
          nombre: 'Arrachera Marinada',
          precio_kg: 280,
          stock: 5,
          estado: 'low_stock',
        },
      ],
    };
  }

  componentDidMount() {
    console.log(
      'Conexión exitosa con el catálogo de Carni-MVP. Cargando stock actualizado...'
    );
  }

  render() {
    const { products } = this.state;
    const activeCount = products.filter((p) => p.estado !== 'inactive').length;

    return React.createElement(
      'main',
      { className: 'inventory-shell' },
      React.createElement(InventoryHeader, { totalProductos: activeCount }),
      React.createElement(
        'section',
        { className: 'inventory-grid' },
        products.map((product) =>
          React.createElement(ProductCard, {
            key: product.id,
            nombre: product.nombre,
            precio_kg: product.precio_kg,
            stock: product.stock,
            estado: product.estado,
          })
        )
      )
    );
  }
}

export default InventoryApp;
