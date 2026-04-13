import React from 'react';
import Header from './components/Header';
import Song from './components/Song';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songs: [
        {
          id: 'song-1',
          titulo: 'Luz de Medianoche',
          artista: 'Aurora Norte',
          album: 'Noches de Ciudad',
          duracion: '3:45'
        },
        {
          id: 'song-2',
          titulo: 'Ruta de Cristal',
          artista: 'Viaje Lunar',
          album: 'Horizonte Azul',
          duracion: '4:08'
        },
        {
          id: 'song-3',
          titulo: 'Pulso Tropical',
          artista: 'Costa Viva',
          album: 'Verano Infinito',
          duracion: '2:58'
        }
      ]
    };
  }

  componentDidMount() {
    console.log('La app Biblioteca Musical se ha cargado correctamente.');
  }

  render() {
    const { songs } = this.state;

    return React.createElement(
      'main',
      { className: 'music-app-shell' },
      React.createElement(
        'section',
        { className: 'music-app-card' },
        React.createElement(Header, null),
        React.createElement(
          'div',
          { className: 'music-library-meta' },
          React.createElement(
            'div',
            null,
            React.createElement('strong', null, songs.length),
            React.createElement('span', null, 'Canciones cargadas')
          ),
          React.createElement(
            'div',
            null,
            React.createElement('strong', null, 'Clase'),
            React.createElement('span', null, 'Componentes React')
          ),
          React.createElement(
            'div',
            null,
            React.createElement('strong', null, 'JSX'),
            React.createElement('span', null, 'Interfaz estatica')
          )
        ),
        React.createElement(
          'section',
          { className: 'song-grid' },
          songs.map((song) => React.createElement(Song, {
            key: song.id,
            titulo: song.titulo,
            artista: song.artista,
            album: song.album,
            duracion: song.duracion
          }))
        )
      )
    );
  }
}

export default App;