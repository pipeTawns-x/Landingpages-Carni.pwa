require("dotenv").config();

const axios = require("axios");
const chalk = require("chalk");

const city = process.env.EBAC_CITY || "San Luis Potosi";
const geocodeUrl = process.env.EBAC_GEOCODE_URL || "https://geocoding-api.open-meteo.com/v1/search";
const weatherUrl = process.env.EBAC_WEATHER_URL || "https://api.open-meteo.com/v1/forecast";

async function getCoordinates(locationName) {
  const response = await axios.get(geocodeUrl, {
    params: {
      name: locationName,
      count: 1,
      language: "es",
      format: "json"
    },
    timeout: 10000
  });

  const [result] = response.data.results || [];

  if (!result) {
    throw new Error(`No se encontraron coordenadas para ${locationName}.`);
  }

  return result;
}

async function getCurrentWeather(latitude, longitude) {
  const response = await axios.get(weatherUrl, {
    params: {
      latitude,
      longitude,
      current: "temperature_2m,apparent_temperature,wind_speed_10m,relative_humidity_2m",
      timezone: "auto"
    },
    timeout: 10000
  });

  if (!response.data.current) {
    throw new Error("La API no devolvió datos meteorológicos actuales.");
  }

  return response.data.current;
}

async function main() {
  console.log(chalk.bold.cyan("EBAC Node.js Phase 1 -> Carni-mvp"));
  console.log(chalk.gray(`Consultando Open-Meteo para ${city}...`));

  const location = await getCoordinates(city);
  const weather = await getCurrentWeather(location.latitude, location.longitude);

  console.log(chalk.green("Consulta completada correctamente."));
  console.log(`Ubicación: ${location.name}, ${location.country}`);
  console.log(`Temperatura: ${weather.temperature_2m} ${weather_units("temperature_2m")}`);
  console.log(`Sensación térmica: ${weather.apparent_temperature} ${weather_units("apparent_temperature")}`);
  console.log(`Humedad relativa: ${weather.relative_humidity_2m}${weather_units("relative_humidity_2m")}`);
  console.log(`Viento: ${weather.wind_speed_10m} ${weather_units("wind_speed_10m")}`);
  console.log(chalk.gray("APIs usadas: Open-Meteo Geocoding + Open-Meteo Forecast."));
  console.log(chalk.gray("Esta capa Node.js es una práctica EBAC y no modifica el flujo actual de la PWA."));
}

function weather_units(metric) {
  const units = {
    temperature_2m: "°C",
    apparent_temperature: "°C",
    relative_humidity_2m: "%",
    wind_speed_10m: "km/h"
  };

  return units[metric] || "";
}

main().catch((error) => {
  console.error(chalk.red("Falló la práctica EBAC Node.js."));
  console.error(error.message);
  process.exitCode = 1;
});