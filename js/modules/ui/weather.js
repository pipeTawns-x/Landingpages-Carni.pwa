// Weather module - Open-Meteo API (Free, No API Key Required)
const SAN_LUIS_LAT = 22.1566;   // Latitude San Luis Potosí
const SAN_LUIS_LON = -100.9855; // Longitude San Luis Potosí

async function fetchWeather() {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    
    url.searchParams.append('latitude', SAN_LUIS_LAT);
    url.searchParams.append('longitude', SAN_LUIS_LON);
    url.searchParams.append('current', 'temperature_2m,relative_humidity_2m,weather_code,is_day');
    url.searchParams.append('timezone', 'America/Mexico_City');
    url.searchParams.append('temperature_unit', 'celsius');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    
    const temp = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const weatherCode = current.weather_code;
    const isDay = current.is_day === 1;

    const weatherDesc = getWeatherDescription(weatherCode, isDay);

    // Update DOM
    const tempElement = document.querySelector('.weather-temp');
    const descElement = document.querySelector('.weather-desc');
    const iconElement = document.querySelector('.weather-icon');
    const humidityElement = document.querySelector('.weather-humidity');

    if (tempElement) tempElement.textContent = `${temp}°C`;
    if (descElement) descElement.textContent = weatherDesc.text;
    if (iconElement) {
      iconElement.className = `bi ${weatherDesc.icon} fs-3 me-2 weather-icon`;
      iconElement.style.color = '#ff9800';
    }
    if (humidityElement) humidityElement.textContent = `${humidity}% Humedad`;

  } catch (error) {
    console.error('Error al cargar clima:', error);
    const tempElement = document.querySelector('.weather-temp');
    const descElement = document.querySelector('.weather-desc');
    if (tempElement) tempElement.textContent = '--°C';
    if (descElement) descElement.textContent = 'Sin conexión';
  }
}

function getWeatherDescription(code, isDay) {
  const codes = {
    0: { text: 'Despejado', icon: isDay ? 'bi-sun' : 'bi-moon' },
    1: { text: 'Mayormente despejado', icon: isDay ? 'bi-sun-fill' : 'bi-moon-fill' },
    2: { text: 'Parcialmente nublado', icon: 'bi-cloud-sun' },
    3: { text: 'Nublado', icon: 'bi-clouds-fill' },
    45: { text: 'Niebla', icon: 'bi-cloud-fog' },
    48: { text: 'Niebla escarcha', icon: 'bi-cloud-fog2' },
    51: { text: 'Llovizna ligera', icon: 'bi-cloud-drizzle' },
    53: { text: 'Llovizna moderada', icon: 'bi-cloud-drizzle' },
    55: { text: 'Llovizna densa', icon: 'bi-cloud-rain' },
    61: { text: 'Lluvia ligera', icon: 'bi-cloud-rain' },
    63: { text: 'Lluvia moderada', icon: 'bi-cloud-rain-heavy' },
    65: { text: 'Lluvia fuerte', icon: 'bi-cloud-rain-heavy' },
    71: { text: 'Nieve ligera', icon: 'bi-snow' },
    73: { text: 'Nieve moderada', icon: 'bi-snow' },
    75: { text: 'Nieve fuerte', icon: 'bi-snow' },
    77: { text: 'Granos de nieve', icon: 'bi-snow' },
    80: { text: 'Chubascos ligeros', icon: 'bi-cloud-rain' },
    81: { text: 'Chubascos moderados', icon: 'bi-cloud-rain-heavy' },
    82: { text: 'Chubascos fuertes', icon: 'bi-cloud-rain-heavy' },
    85: { text: 'Nieve con chubascos', icon: 'bi-snow' },
    86: { text: 'Nieve con chubascos fuertes', icon: 'bi-snow' },
    80: { text: 'Chubascos', icon: 'bi-cloud-rain-heavy' },
    95: { text: 'Tormenta ligera', icon: 'bi-cloud-lightning' },
    96: { text: 'Tormenta con granizo', icon: 'bi-cloud-lightning-rain' },
    99: { text: 'Tormenta fuerte', icon: 'bi-cloud-lightning-rain' },
  };

  return codes[code] || { text: 'Desconocido', icon: 'bi-question-circle' };
}

// Load weather when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fetchWeather);
} else {
  fetchWeather();
}

// Update every 30 minutes
setInterval(fetchWeather, 30 * 60 * 1000);
