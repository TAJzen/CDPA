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

// LANDMARK: Task 4.18 - Debounce Helper
function debounce(func, delay = 500) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

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

        const { latitude, longitude, name, timezone } = geoData.results[0];

        // --- STEP 2: Weather Forecast (Coordinates -> Data) [cite: 39-40] ---
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        const weatherRes = await fetch(weatherUrl, { signal: controller.signal });
        
        if (!weatherRes.ok) throw new Error(`Weather API Error: ${weatherRes.status}`);
        const weatherData = await weatherRes.json();

        clearTimeout(timeoutId); // Stop the 10s timer
        
        // SUCCESS: Show the data [cite: 41]
        renderWeather(name, weatherData);
        fetchLocalTime(timezone);

    } catch (err) {
        // Task 4.19: Handle timeout or network crash [cite: 60]
        const errMsg = err.name === 'AbortError' ? "Request timed out (10s)." : "Network error. Please check your connection.";
        handleFailure(errMsg);
    }
}

// LANDMARK: Task 2.8 - Render UI using DOM Methods (No innerHTML) [cite: 41, 76]
// LANDMARK: Task 2.8 - Populate ALL UI cards with real data [cite: 41]
function renderWeather(name, data) {
    toggleSkeletons(false); // Task 2.8: Remove skeleton classes [cite: 41]
    
    // 1. Update Main Card [cite: 21-22]
    document.getElementById("city-name").textContent = name;
    document.getElementById("temp").textContent = `${Math.round(data.current_weather.temperature)}°C`;
    
    const info = WEATHER_LOOKUP[data.current_weather.weathercode] || { desc: "Cloudy", emoji: "☁️" };
    document.getElementById("description").textContent = `${info.emoji} ${info.desc}`;
    document.getElementById("humidity").textContent = data.hourly.relativehumidity_2m[0] + "%";
    document.getElementById("wind-speed").textContent = data.current_weather.windspeed + " km/h";

    // 2. Task 2.3 & 2.8: Populate 7-Day Forecast cards [cite: 23, 41]
    const forecastRow = document.getElementById("forecast-row");
    forecastRow.innerHTML = ""; // Task 2.8: Clear skeletons before populating [cite: 41]

    data.daily.time.forEach((date, i) => {
        // Create the card container
        const card = document.createElement("div");
        card.className = "forecast-card";

        // Day Name (e.g., Mon, Tue) 
        const dayName = document.createElement("p");
        dayName.textContent = new Date(date).toLocaleDateString('en', { weekday: 'short' });

        // Weather Icon/Emoji (Task 2.10 Lookup) [cite: 44]
        const emojiSpan = document.createElement("span");
        const dailyInfo = WEATHER_LOOKUP[data.daily.weathercode[i]] || { emoji: "☁️" };
        emojiSpan.textContent = dailyInfo.emoji;
        emojiSpan.style.fontSize = "2rem";
        emojiSpan.style.display = "block";

        // High/Low Temperature 
        const tempP = document.createElement("p");
        tempP.style.fontWeight = "bold";
        const high = Math.round(data.daily.temperature_2m_max[i]);
        const low = Math.round(data.daily.temperature_2m_min[i]);
        tempP.textContent = `${high}° / ${low}°`;

        // Assemble the card [cite: 41]
        card.appendChild(dayName);
        card.appendChild(emojiSpan);
        card.appendChild(tempP);
        forecastRow.appendChild(card);
    });

    console.log("Task 2: All UI cards successfully populated.");
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

// 4. EVENT LISTENERS (Updated with Debounce)
const searchInput = document.getElementById("city-input");

// Manual search on button click
document.getElementById("search-btn").addEventListener("click", () => {
    getWeatherData(searchInput.value);
});

// Task 4.18: Automatic search while typing (Debounced)
searchInput.addEventListener("input", debounce(() => {
    if (searchInput.value.trim().length >= 3) {
        getWeatherData(searchInput.value);
    }
}, 500));

// LANDMARK: Task 3 - jQuery AJAX for Local Time [cite: 46-51]
function fetchLocalTime(timezone) {
    // 11. Use $.getJSON() to call the World TimeAPI 
    $.getJSON(`https://worldtimeapi.org/api/timezone/${timezone}`)
        .done(function(data) {
            // 12. Parse the datetime string and display it [cite: 51]
            const dateTime = data.datetime; 
            const time = dateTime.split('T')[1].substring(0, 5); 
            document.getElementById("local-time").textContent = `Local Time: ${time}`;
        })
        .fail(function() {
            // 13. Fallback to browser's local time if API fails [cite: 51]
            const now = new Date();
            const fallback = now.getHours().toString().padStart(2, '0') + ":" + 
                             now.getMinutes().toString().padStart(2, '0');
            document.getElementById("local-time").textContent = `Local Time: ${fallback} (Local)`;
        })
        .always(function() {
            // 15. Log a timestamp of the completed request to the console [cite: 51]
            console.log("Time request cycle finished at: " + new Date().toLocaleTimeString());
        });
}