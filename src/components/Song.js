import React from 'react';

class Song extends React.Component {
  render() {
    const { titulo, artista, album, duracion } = this.props;

    return React.createElement(
      'article',
      { className: 'song-card' },
      React.createElement(
        'div',
        null,
        React.createElement('p', { className: 'song-card__label' }, 'Cancion'),
        React.createElement('h2', null, titulo)
      ),
      React.createElement(
        'dl',
        { className: 'song-card__details' },
        React.createElement(
          'div',
          null,
          React.createElement('dt', null, 'Artista'),
          React.createElement('dd', null, artista)
        ),
        React.createElement(
          'div',
          null,
          React.createElement('dt', null, 'Album'),
          React.createElement('dd', null, album)
        ),
        React.createElement(
          'div',
          null,
          React.createElement('dt', null, 'Duracion'),
          React.createElement('dd', null, duracion)
        )
      )
    );
  }
}

export default Song;