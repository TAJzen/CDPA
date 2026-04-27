// 1. WEATHER LOOKUP TABLE (Required for Task 2.10) [cite: 44]
const WEATHER_LOOKUP = {
    0: { desc: "Clear sky", emoji: "☀️" },
    1: { desc: "Mainly clear", emoji: "🌤️" },
    2: { desc: "Partly cloudy", emoji: "⛅" },
    3: { desc: "Overcast", emoji: "☁️" },
    45: { desc: "Fog", emoji: "🌫️" },
    61: { desc: "Slight rain", emoji: "🌧️" },
    95: { desc: "Thunderstorm", emoji: "⛈️" }
};

// 2. MAIN FETCH FUNCTION (Task 2 & 4) [cite: 35, 56]
async function getWeatherData(cityName) {
    const errorBanner = document.getElementById("error-banner");
    const errorMsg = document.getElementById("error-message");

    // Task 4.19: 10s Timeout using AbortController [cite: 59-63]
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        // Reset UI state
        errorBanner.classList.add("is-hidden");
        toggleSkeletons(true);

        // --- STEP A: Geocoding API (Task 2.5) --- [cite: 37]
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl, { signal: controller.signal });
        
        // Task 4.16: Explicit HTTP Error Check [cite: 57]
        if (!geoResponse.ok) throw new Error(`HTTP Error: ${geoResponse.status}`);
        
        const geoData = await geoResponse.json();

        // Task 2.6: Handle City Not Found (Do NOT throw) [cite: 38]
        if (!geoData.results || geoData.results.length === 0) {
            handleFailure("City not found. Please try again.");
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];

        // --- STEP B: Weather Forecast API (Task 2.7) --- [cite: 39, 40]
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl, { signal: controller.signal });
        
        if (!weatherResponse.ok) throw new Error(`Weather API Error: ${weatherResponse.status}`);
        
        const weatherData = await weatherResponse.json();
        
        // Success: Clear the timeout and update UI
        clearTimeout(timeoutId);
        renderWeather(name, weatherData);

    } catch (error) {
        // Task 4.19/20: Handle Timeout or Network Failures [cite: 60]
        const message = error.name === "AbortError" ? "Request timed out (10s)." : "Network error. Please check your connection.";
        handleFailure(message);
    }
}

// 3. UI HELPERS (No innerHTML as per Task 2.8) [cite: 41]
function renderWeather(name, data) {
    toggleSkeletons(false); // Task 2.8: Remove skeleton classes on success [cite: 41]
    
    // Update main card
    document.getElementById("city-name").textContent = name;
    document.getElementById("temp").textContent = `${Math.round(data.current_weather.temperature)}°C`;
    
    const info = WEATHER_LOOKUP[data.current_weather.weathercode] || { desc: "Unknown", emoji: "☁️" };
    document.getElementById("description").textContent = `${info.emoji} ${info.desc}`;
    document.getElementById("humidity").textContent = `${data.current_weather.weathercode}%`; // Placeholder for humidity

    console.log("Weather Data Loaded for:", name);
}

function toggleSkeletons(show) {
    const mainCard = document.getElementById("current-weather");
    const textLines = document.querySelectorAll(".skeleton-text");
    const forecastCards = document.querySelectorAll(".forecast-card");

    if (show) {
        mainCard.classList.add("skeleton");
        textLines.forEach(line => line.classList.add("skeleton-text"));
        forecastCards.forEach(card => card.classList.add("skeleton"));
    } else {
        mainCard.classList.remove("skeleton");
        textLines.forEach(line => line.classList.remove("skeleton-text"));
        forecastCards.forEach(card => card.classList.remove("skeleton"));
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
    getWeatherData(document.getElementById("city-input").value);
});