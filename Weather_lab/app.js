// LANDMARK: Task 2.10 - Weather Lookup Table [cite: 44]
const WEATHER_LOOKUP = {
    0: { desc: "Clear sky", emoji: "☀️" },
    1: { desc: "Mainly clear", emoji: "🌤️" },
    2: { desc: "Partly cloudy", emoji: "⛅" },
    3: { desc: "Overcast", emoji: "☁️" },
    45: { desc: "Fog", emoji: "🌫️" },
    61: { desc: "Slight rain", emoji: "🌧️" },
    95: { desc: "Thunderstorm", emoji: "⛈️" }
};

// LANDMARK: Task 2 & 4 - The Main API Logic [cite: 35, 56, 76]
async function getWeatherData(cityName) {
    const banner = document.getElementById("error-banner");
    const message = document.getElementById("error-message");

    // Task 4.19: 10s Timeout via AbortController [cite: 59-63]
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        banner.classList.add("is-hidden"); // Hide previous errors
        toggleSkeletons(true); // Start shimmer

        // --- STEP 1: Geocoding (City Name -> Coordinates) [cite: 37] ---
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`;
        const geoRes = await fetch(geoUrl, { signal: controller.signal });
        
        if (!geoRes.ok) throw new Error(`HTTP Error: ${geoRes.status}`); // Task 4.16 [cite: 57]
        const geoData = await geoRes.json();

        if (!geoData.results) { // Task 2.6: City not found [cite: 38]
            handleFailure("City not found. Please try again.");
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];

        // --- STEP 2: Weather Forecast (Coordinates -> Data) [cite: 39-40] ---
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        const weatherRes = await fetch(weatherUrl, { signal: controller.signal });
        
        if (!weatherRes.ok) throw new Error(`Weather API Error: ${weatherRes.status}`);
        const weatherData = await weatherRes.json();

        clearTimeout(timeoutId); // Stop the 10s timer
        
        // SUCCESS: Show the data [cite: 41]
        renderWeather(name, weatherData);

    } catch (err) {
        // Task 4.19: Handle timeout or network crash [cite: 60]
        const errMsg = err.name === 'AbortError' ? "Request timed out (10s)." : "Network error. Please check your connection.";
        handleFailure(errMsg);
    }
}

// LANDMARK: Task 2.8 - Render UI using DOM Methods (No innerHTML) [cite: 41, 76]
function renderWeather(name, data) {
    toggleSkeletons(false); // Stop shimmering
    
    // 1. Update Main Card [cite: 21-22]
    document.getElementById("city-name").textContent = name;
    document.getElementById("temp").textContent = `${Math.round(data.current_weather.temperature)}°C`;
    
    // 2. Data Transformation (Weather Code -> Emoji) [cite: 44]
    const info = WEATHER_LOOKUP[data.current_weather.weathercode] || { desc: "Unknown", emoji: "☁️" };
    document.getElementById("description").textContent = `${info.emoji} ${info.desc}`;

    // 3. Humidity & Wind (Take first index from hourly data) [cite: 40, 76]
    document.getElementById("humidity").textContent = data.hourly.relativehumidity_2m[0] + "%";
    document.getElementById("wind-speed").textContent = data.current_weather.windspeed + " km/h";

    console.log("Step 3 Complete for: " + name);
}

// UI HELPERS
function toggleSkeletons(show) {
    const main = document.getElementById("current-weather");
    const texts = document.querySelectorAll(".skeleton-text");
    const cards = document.querySelectorAll(".forecast-card");

    if (show) {
        main.classList.add("skeleton");
        texts.forEach(t => t.classList.add("skeleton-text"));
        cards.forEach(c => c.classList.add("skeleton"));
    } else {
        main.classList.remove("skeleton");
        texts.forEach(t => {
            t.classList.remove("skeleton-text");
            t.style.color = "inherit"; // Ensure text is visible
        });
        cards.forEach(c => c.classList.remove("skeleton"));
    }
}

function handleFailure(msg) {
    toggleSkeletons(false);
    const banner = document.getElementById("error-banner");
    document.getElementById("error-message").textContent = msg;
    banner.classList.remove("is-hidden");
}

// 4. EVENT LISTENERS
document.getElementById("search-btn").addEventListener("click", () => {
    const city = document.getElementById("city-input").value;
    getWeatherData(city);
});