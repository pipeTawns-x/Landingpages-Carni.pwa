import React from 'react';

class Header extends React.Component {
  render() {
    return React.createElement(
      'header',
      { className: 'music-header' },
      React.createElement('p', { className: 'music-header__kicker' }, 'Practica EBAC React'),
      React.createElement('h1', null, 'Biblioteca Musical'),
      React.createElement('p', null, 'Una colección estática para practicar JSX, props y componentes de clase.')
    );
  }
}

export default Header;