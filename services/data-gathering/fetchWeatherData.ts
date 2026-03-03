import { useGeneralStore } from "@/stores/general";
import { useWeatherStore } from "@/stores/weather";

function getWeatherCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow Showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function getWeatherIcon(code: number): string {
  if (code === 0) return "\u2600\uFE0F"; // sun
  if (code <= 3) return "\u26C5"; // partly cloudy
  if (code <= 48) return "\uD83C\uDF2B\uFE0F"; // fog
  if (code <= 57) return "\uD83C\uDF26\uFE0F"; // drizzle
  if (code <= 67) return "\uD83C\uDF27\uFE0F"; // rain
  if (code <= 77) return "\uD83C\uDF28\uFE0F"; // snow
  if (code <= 82) return "\uD83C\uDF26\uFE0F"; // showers
  if (code <= 86) return "\uD83C\uDF28\uFE0F"; // snow showers
  if (code <= 99) return "\u26C8\uFE0F"; // thunderstorm
  return "\u2601\uFE0F"; // cloud
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export async function fetchWeatherData(slideId: string) {
  const coordinates = useGeneralStore.getState().coordinates;
  if (!coordinates) {
    console.error("[WEATHER] No coordinates available");
    useWeatherStore.getState().setDataError(slideId, true);
    return;
  }

  const { lat, lng } = coordinates;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit` +
      `&wind_speed_unit=mph` +
      `&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

    const data = await response.json();

    const current = {
      temp: Math.round(data.current.temperature_2m),
      condition: getWeatherCondition(data.current.weather_code),
      code: data.current.weather_code,
      icon: getWeatherIcon(data.current.weather_code),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      date: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    const daily = data.daily.time.map((dateStr: string, i: number) => ({
      date: dateStr,
      dayName: getDayName(dateStr),
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      condition: getWeatherCondition(data.daily.weather_code[i]),
      code: data.daily.weather_code[i],
      icon: getWeatherIcon(data.daily.weather_code[i]),
    }));

    useWeatherStore.getState().setWeatherData(slideId, { current, daily });
    useWeatherStore.getState().setDataError(slideId, false);

    console.log("[WEATHER] Data fetched successfully for slide:", slideId);
  } catch (error) {
    console.error("[WEATHER] Failed to fetch weather data:", error);
    useWeatherStore.getState().setDataError(slideId, true);
  }
}
