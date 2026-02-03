import { useWeatherStore } from "@/stores/weather";
import { useGeneralStore } from "@/stores/general";
import { fetchWeatherData } from "@/services/data-gathering/fetchWeatherData";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Footer from "../shared-components/footer";
import WeatherIcon from "../shared-components/weather-icon";

export default function WeatherPreview({
  slideId,
  previewMode = false,
}: {
  slideId: string;
  previewMode?: boolean;
}) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor") && !previewMode;
  const hasFetched = useRef(false);

  const title = useWeatherStore(
    (state) => state.slides[slideId]?.title || ""
  );
  const setTitle = useWeatherStore((state) => state.setTitle);
  const backgroundColor = useWeatherStore(
    (state) => state.slides[slideId]?.backgroundColor || "#192F51"
  );
  const bgImage = useWeatherStore(
    (state) => state.slides[slideId]?.bgImage || ""
  );
  const titleColor = useWeatherStore(
    (state) => state.slides[slideId]?.titleColor || "#ffffff"
  );
  const textColor = useWeatherStore(
    (state) => state.slides[slideId]?.textColor || "#ffffff"
  );
  const logoImage = useWeatherStore(
    (state) => state.slides[slideId]?.logoImage || ""
  );
  const weatherData = useWeatherStore(
    (state) => state.slides[slideId]?.weatherData || null
  );
  const dataError = useWeatherStore(
    (state) => state.slides[slideId]?.dataError || false
  );

  const coordinates = useGeneralStore((state) => state.coordinates);

  // Fetch weather data on mount in editor mode
  useEffect(() => {
    if (isEditor && coordinates && !hasFetched.current) {
      hasFetched.current = true;
      fetchWeatherData(slideId);
    }
  }, [isEditor, coordinates, slideId]);

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {/* Title + Logo */}
      <div className="p-3 border-b border-white/20 flex-shrink-0 flex items-center">
        <div
          className={`flex-1 rounded px-4 ${
            isEditor ? "border-2 border-[#11d1f7] py-2" : ""
          }`}
        >
          {isEditor ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(slideId, e.target.value)}
              placeholder="Type title here"
              className="w-full bg-transparent outline-none text-4xl font-light placeholder-white/50"
              style={{ color: titleColor }}
            />
          ) : (
            <div
              className="w-full bg-transparent font-light"
              style={{
                color: titleColor,
                fontSize: "clamp(1.5rem, 6vh, 8rem)",
                lineHeight: "1.2",
              }}
            >
              {title || ""}
            </div>
          )}
        </div>
        {logoImage && (
          <img
            src={logoImage}
            alt="Logo"
            className="max-h-16 object-contain ml-4 flex-shrink-0"
          />
        )}
      </div>

      {/* Weather Content */}
      <div className="flex-1 min-h-0 p-6 flex gap-6">
        {dataError ? (
          <div className="w-full flex items-center justify-center">
            <p style={{ color: textColor, opacity: 0.7, fontSize: isEditor ? "1rem" : "3vh" }}>
              Unable to load weather data. Please check your location settings.
            </p>
          </div>
        ) : !weatherData ? (
          <div className="w-full flex items-center justify-center">
            <p style={{ color: textColor, opacity: 0.7, fontSize: isEditor ? "1rem" : "3vh" }}>
              Loading weather data...
            </p>
          </div>
        ) : (
          <>
            {/* Left: Current Weather */}
            <div className="flex-1 flex flex-col justify-center items-center">
              <div
                style={{
                  fontSize: isEditor ? "1.1rem" : "3.5vh",
                  opacity: 0.8,
                  marginBottom: isEditor ? "8px" : "1vh",
                }}
              >
                {weatherData.current.date}
              </div>

              <div style={{ lineHeight: 1 }}>
                <WeatherIcon code={weatherData.current.code} size={isEditor ? "5rem" : "18vh"} />
              </div>

              <div
                style={{
                  fontSize: isEditor ? "4.5rem" : "15vh",
                  fontWeight: 200,
                  lineHeight: 1,
                  marginTop: isEditor ? "8px" : "1vh",
                }}
              >
                {weatherData.current.temp}°F
              </div>

              <div
                style={{
                  fontSize: isEditor ? "1.5rem" : "5vh",
                  fontWeight: 300,
                  marginTop: isEditor ? "4px" : "0.5vh",
                }}
              >
                {weatherData.current.condition}
              </div>

              <div
                className="flex gap-4 mt-2"
                style={{
                  fontSize: isEditor ? "1rem" : "3vh",
                  opacity: 0.7,
                }}
              >
                <span>Wind: {weatherData.current.windSpeed} mph</span>
                <span>Humidity: {weatherData.current.humidity}%</span>
              </div>
            </div>

            {/* Right: 7-Day Forecast */}
            <div className="flex-1 flex flex-col justify-center">
              <div
                className="font-medium mb-2"
                style={{
                  fontSize: isEditor ? "1.3rem" : "4vh",
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: isEditor ? "4px" : "0.5vh",
                }}
              >
                7-Day Forecast
              </div>
              {weatherData.daily.map((day: any, i: number) => {
                const dayOfMonth = new Date(day.date + "T12:00:00").getDate().toString().padStart(2, "0");
                return (
                  <div
                    key={day.date}
                    className="flex items-center"
                    style={{
                      padding: isEditor ? "5px 0" : "1vh 0",
                      borderBottom:
                        i < weatherData.daily.length - 1
                          ? "1px solid rgba(255,255,255,0.1)"
                          : "none",
                      fontSize: isEditor ? "1.1rem" : "3.8vh",
                      gap: isEditor ? "12px" : "1.5vh",
                    }}
                  >
                    <span className="font-medium" style={{ minWidth: isEditor ? "120px" : "22vh" }}>
                      {day.dayName} {dayOfMonth}
                    </span>
                    <span style={{ minWidth: isEditor ? "70px" : "10vh", marginLeft: isEditor ? "30px" : "40px"}}>
                      {day.high}°/{day.low}°
                    </span>
                    <span className="flex items-center gap-2" style={{ marginLeft: "auto" }}>
                      <WeatherIcon code={day.code} size={isEditor ? "1.5rem" : "4.5vh"} />
                      <span style={{ opacity: 0.8 }}>{day.condition}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
