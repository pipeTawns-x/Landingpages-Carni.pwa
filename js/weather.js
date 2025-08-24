// Clave API de OpenWeatherMap (debería estar en variables de entorno)
const weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY || 'your-api-key';

// Coordenadas de San Luis Potosí (podrían obtenerse por geolocalización)
const defaultLocation = {
  lat: 22.1565,
  lon: -100.9855
};

// Cargar información del clima al iniciar
document.addEventListener('DOMContentLoaded', () => {
  const weatherWidget = document.getElementById('weatherWidget');
  if (weatherWidget) {
    loadWeatherData();
  }
});

// Obtener datos del clima
async function loadWeatherData() {
  try {
    const weatherWidget = document.getElementById('weatherWidget');
    weatherWidget.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi bi-cloud-arrow-down fs-3 me-2 weather-icon"></i>
        <div>
          <div class="weather-temp">Cargando clima...</div>
          <small class="weather-desc text-muted"></small>
        </div>
      </div>
    `;
    
    // Intentar geolocalización del usuario
    let location = defaultLocation;
    
    if (navigator.geolocation) {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      location = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };
    }
    
    // Obtener datos del clima
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${weatherApiKey}&units=metric&lang=es`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener datos del clima');
    }
    
    const data = await response.json();
    
    // Actualizar widget
    updateWeatherWidget(data);
    
    // Mostrar sugerencias basadas en el clima
    showWeatherSuggestions(data);
  } catch (error) {
    console.error('Error loading weather data:', error);
    document.querySelector('.weather-temp').textContent = 'Clima no disponible';
    document.querySelector('.weather-desc').textContent = '';
  }
}

// Actualizar el widget del clima
function updateWeatherWidget(data) {
  const temp = Math.round(data.main.temp);
  const description = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  
  // Seleccionar icono basado en el código del clima
  const iconClass = getWeatherIconClass(iconCode);
  
  document.querySelector('.weather-icon').className = `bi ${iconClass} fs-3 me-2 weather-icon`;
  document.querySelector('.weather-temp').textContent = `${temp}°C`;
  document.querySelector('.weather-desc').textContent = description;
}

// Mostrar sugerencias basadas en el clima
function showWeatherSuggestions(data) {
  const temp = data.main.temp;
  const weatherId = data.weather[0].id;
  
  let suggestion = '';
  
  // Sugerencias basadas en temperatura
  if (temp > 30) {
    suggestion = '¡Día caluroso! Perfecto para carnes frías y ensaladas.';
  } else if (temp > 20) {
    suggestion = 'Clima agradable. Ideal para una parrillada al aire libre.';
  } else if (temp > 10) {
    suggestion = 'Día fresco. ¿Qué tal un estofado o carne al horno?';
  } else {
    suggestion = '¡Hace frío! Caliéntate con nuestros cortes para guisos.';
  }
  
  // Sugerencias adicionales basadas en condiciones climáticas
  if (weatherId >= 200 && weatherId < 300) {
    suggestion += ' Tormentas eléctricas: mejor disfruta de carnes preparadas en casa.';
  } else if (weatherId >= 300 && weatherId < 600) {
    suggestion += ' Día lluvioso: perfecto para cocinar al horno o a la plancha.';
  }
  
  // Mostrar sugerencia (podría ser un toast o notificación)
  console.log('Sugerencia:', suggestion);
}

// Obtener clase de icono basado en código de clima
function getWeatherIconClass(iconCode) {
  const iconMap = {
    '01d': 'bi-sun',          // clear sky (day)
    '01n': 'bi-moon',         // clear sky (night)
    '02d': 'bi-cloud-sun',    // few clouds (day)
    '02n': 'bi-cloud-moon',   // few clouds (night)
    '03d': 'bi-cloud',        // scattered clouds
    '03n': 'bi-cloud',
    '04d': 'bi-clouds',       // broken clouds
    '04n': 'bi-clouds',
    '09d': 'bi-cloud-rain',   // shower rain
    '09n': 'bi-cloud-rain',
    '10d': 'bi-cloud-rain',   // rain (day)
    '10n': 'bi-cloud-rain',   // rain (night)
    '11d': 'bi-lightning',    // thunderstorm
    '11n': 'bi-lightning',
    '13d': 'bi-snow',         // snow
    '13n': 'bi-snow',
    '50d': 'bi-cloud-fog',    // mist
    '50n': 'bi-cloud-fog'
  };
  
  return iconMap[iconCode] || 'bi-cloud';
}