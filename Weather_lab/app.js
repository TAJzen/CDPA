// Task 2.10: Weather Code Lookup [cite: 44]
const WEATHER_LOOKUP = {
    0: { desc: "Clear sky", emoji: "☀️" }, 1: { desc: "Mainly clear", emoji: "🌤️" },
    2: { desc: "Partly cloudy", emoji: "⛅" }, 3: { desc: "Overcast", emoji: "☁️" },
    45: { desc: "Fog", emoji: "🌫️" }, 61: { desc: "Slight rain", emoji: "🌧️" },
    95: { desc: "Thunderstorm", emoji: "⛈️" }
};

let currentData = null, isF = false;

// Task 4.18: Debounce Implementation [cite: 59]
function debounce(fn, d = 500) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); };
}

// Task 4.5: Unit Conversion [cite: 67]
function fmt(c) { 
    if (isF) return Math.round((c * 9/5) + 32) + "°F";
    return Math.round(c) + "°C"; 
}

// Task 2: Chained Fetch Requests with timeout [cite: 36, 59-63]
async function fetchWeather(city) {
    const banner = document.getElementById("error-banner");
    
    // Task 4.19: 10s AbortController timeout 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        banner.classList.add("is-hidden");
        toggleSkeletons(true);
        
        // Task 2.5: Geocoding API [cite: 37]
        const gRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city.split(',')[0]}&count=1`, { signal: controller.signal });
        
        // Task 4.16: Explicit HTTP Error Check 
        if (!gRes.ok) throw new Error(`HTTP Error: ${gRes.status}`);
        
        const gData = await gRes.json();
        
        // Task 2.6: Handle City Not Found [cite: 38]
        if (!gData.results) {
            handleFailure("City not found. Please try another name.");
            return;
        }

        const { latitude: lat, longitude: lon, name, timezone } = gData.results[0];
        
        // Task 2.7: Open-Meteo Weather API [cite: 39-40]
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`, { signal: controller.signal });
        if (!wRes.ok) throw new Error(`Weather API Error: ${wRes.status}`);
        
        const wData = await wRes.json();
        clearTimeout(timeoutId);
        
        currentData = wData;
        render(name, wData); // Task 2.8: Remove skeletons and populate UI [cite: 41]
        fetchTime(timezone); // Task 3.11: Start jQuery Time request [cite: 48]
    } catch (e) { 
        toggleSkeletons(false);
        // Task 4.19: Handle timeout error [cite: 60]
        handleFailure(e.name === 'AbortError' ? "Request timed out (10s)." : e.message);
    }
}

// Task 3: jQuery AJAX with .done(), .fail(), .always() [cite: 46, 51]
function fetchTime(tz) {
    $.getJSON(`https://worldtimeapi.org/api/timezone/${tz}`)
        .done(d => { 
            // Task 3.12: Display local time [cite: 51]
            document.getElementById("local-time").textContent = `Local Time: ${d.datetime.split('T')[1].substring(0, 5)}`; 
        })
        .fail(() => { 
            // Task 3.13: Fallback to browser time [cite: 51]
            document.getElementById("local-time").textContent = `Local Time: ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} (Browser)`; 
        })
        .always(() => {
            // Task 3.15: Log timestamp to console [cite: 51]
            console.log("Time request completed at: " + new Date().toLocaleTimeString());
        });
}

// Task 2.8: UI Rendering using pure DOM [cite: 41]
function render(name, data) {
    toggleSkeletons(false);
    document.getElementById("city-name").textContent = name;
    document.getElementById("temp").textContent = fmt(data.current_weather.temperature);
    const info = WEATHER_LOOKUP[data.current_weather.weathercode] || { desc: "Clear", emoji: "☀️" };
    document.getElementById("description").textContent = `${info.emoji} ${info.desc}`;
    document.getElementById("humidity").textContent = data.hourly.relativehumidity_2m[0] + "%";
    document.getElementById("wind-speed").textContent = data.current_weather.windspeed + " km/h";

    const row = document.getElementById("forecast-row");
    row.innerHTML = "";
    data.daily.time.forEach((d, i) => {
        const c = document.createElement("div");
        c.className = "forecast-card";
        c.innerHTML = `<p style="font-size:0.7rem; font-weight:bold">${new Date(d).toLocaleDateString('en',{weekday:'short'})}</p>
                       <div style="margin:8px 0; font-size:1.5rem">${WEATHER_LOOKUP[data.daily.weathercode[i]]?.emoji || "☁️"}</div>
                       <p><b>${fmt(data.daily.temperature_2m_max[i])}</b></p>
                       <p style="font-size:0.8rem; opacity:0.7">${fmt(data.daily.temperature_2m_min[i])}</p>`;
        row.appendChild(c);
    });
}

function toggleSkeletons(show) {
    const main = document.getElementById("current-weather");
    const texts = document.querySelectorAll(".skeleton-text");
    if (show) { main.classList.add("skeleton"); texts.forEach(t => t.classList.add("skeleton-text")); }
    else { main.classList.remove("skeleton"); texts.forEach(t => t.classList.remove("skeleton-text")); }
}

function handleFailure(msg) {
    toggleSkeletons(false);
    const banner = document.getElementById("error-banner");
    document.getElementById("error-message").textContent = msg;
    banner.classList.remove("is-hidden");
}

// Task 4: Input Validation, Debounce & Suggestions [cite: 58-59]
const input = document.getElementById("city-input");
const suggestCard = document.getElementById("suggestion-card");
const suggestList = document.getElementById("suggestion-list");

input.addEventListener("input", debounce(async (e) => {
    const val = e.target.value.trim();
    
    // Task 4.17: Show validation message if < 2 chars 
    if (val.length > 0 && val.length < 2) {
        handleFailure("Please enter at least 2 characters.");
        return;
    }
    
    if (val.length < 2) { 
        suggestCard.classList.add("is-hidden"); 
        return; 
    }

    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${val}&count=5`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            // Task 4.18: Auto-search first result [cite: 59]
            fetchWeather(data.results[0].name);

            // Populate Recommendation Card (Bonus/Search-Ahead)
            suggestList.innerHTML = "";
            data.results.forEach(city => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.textContent = `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}`;
                div.onclick = () => {
                    fetchWeather(div.textContent);
                    input.value = city.name;
                    suggestCard.classList.add("is-hidden");
                };
                suggestList.appendChild(div);
            });
            suggestCard.classList.remove("is-hidden");
        }
    } catch (err) { console.error("Search failed"); }
}, 500));

document.getElementById("search-btn").addEventListener("click", () => fetchWeather(input.value));

document.getElementById("unit-switch").addEventListener("change", (e) => {
    isF = e.target.checked;
    if (currentData) render(document.getElementById("city-name").textContent, currentData);
});