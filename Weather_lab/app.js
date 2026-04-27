// Task 2.10: Weather Lookup Table
const WEATHER_LOOKUP = {
    0: { desc: "Clear sky", emoji: "☀️" }, 1: { desc: "Mainly clear", emoji: "🌤️" },
    2: { desc: "Partly cloudy", emoji: "⛅" }, 3: { desc: "Overcast", emoji: "☁️" },
    45: { desc: "Fog", emoji: "🌫️" }, 61: { desc: "Slight rain", emoji: "🌧️" },
    95: { desc: "Thunderstorm", emoji: "⛈️" }
};

let currentData = null, isF = false;

// Task 4.18: 500ms Debounce
function debounce(fn, d = 500) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); };
}

function fmt(c) { return isF ? Math.round((c * 9/5) + 32) + "°F" : Math.round(c) + "°C"; }

/**
 * Main Fetch Request Chain [cite: 36, 37, 39-40, 59-63]
 */
async function fetchWeather(city, fLat = null, fLon = null, fTz = null, fFull = null) {
    const banner = document.getElementById("error-banner");
    // Task 4.19: 10s Timeout [cite: 60-63]
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        banner.classList.add("is-hidden");
        toggleSkeletons(true); // START GLIMMER
        
        let lat, lon, name, tz, fullLoc;

        if (fLat !== null && fLon !== null) {
            lat = fLat; lon = fLon; name = city; tz = fTz || "auto"; fullLoc = fFull;
        } else {
            const gRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city.split(',')[0]}&count=1`, { signal: controller.signal });
            if (!gRes.ok) throw new Error(`HTTP ${gRes.status}`);
            const gData = await gRes.json();
            if (!gData.results) { handleFailure("City not found."); return; }
            const first = gData.results[0];
            lat = first.latitude; lon = first.longitude; name = first.name; tz = first.timezone;
            fullLoc = `${first.admin1 || ''}${first.admin1 ? ', ' : ''}${first.country || ''}`;
        }

        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`, { signal: controller.signal });
        if (!wRes.ok) throw new Error(`HTTP ${wRes.status}`);
        const wData = await wRes.json();
        
        clearTimeout(timeoutId);
        currentData = wData;
        render(name, fullLoc, wData); // Task 2.8: REMOVE GLIMMER
        fetchTime(tz); 
    } catch (e) { 
        handleFailure(e.name === 'AbortError' ? "Request Timed Out (10s)" : e.message);
    }
}

// Task 3: jQuery with .done(), .fail(), .always() [cite: 46-51]
function fetchTime(tz) {
    $.getJSON(`https://worldtimeapi.org/api/timezone/${tz}`)
        .done(d => { document.getElementById("local-time").textContent = `Local Time: ${d.datetime.split('T')[1].substring(0, 5)}`; })
        .fail(() => { 
            const now = new Date();
            document.getElementById("local-time").textContent = `Local Time: ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} (Browser)`; 
        })
        .always(() => console.log("Time cycle finished at: " + new Date().toLocaleTimeString()));
}

function render(name, fullLoc, data) {
    toggleSkeletons(false); // STOP GLIMMER
    document.getElementById("city-name").textContent = name;
    document.getElementById("full-location").textContent = fullLoc;
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
                       <p><b>${fmt(data.daily.temperature_2m_max[i])}</b></p>`;
        row.appendChild(c);
    });
}

function toggleSkeletons(show) {
    const hero = document.getElementById("current-weather");
    const texts = document.querySelectorAll(".skeleton-text");
    const cards = document.querySelectorAll(".forecast-card");
    if (show) {
        hero.classList.add("skeleton");
        texts.forEach(t => t.classList.add("skeleton-text"));
        cards.forEach(c => c.classList.add("skeleton"));
    } else {
        hero.classList.remove("skeleton");
        texts.forEach(t => t.classList.remove("skeleton-text"));
        cards.forEach(c => c.classList.remove("skeleton"));
    }
}

function handleFailure(msg) {
    toggleSkeletons(false);
    const banner = document.getElementById("error-banner");
    document.getElementById("error-message").textContent = msg;
    banner.classList.remove("is-hidden");
}

// Event Listeners [cite: 58-59, 76]
const input = document.getElementById("city-input");
const suggestCard = document.getElementById("suggestion-card");
const suggestList = document.getElementById("suggestion-list");

input.addEventListener("input", debounce(async (e) => {
    const val = e.target.value.trim();
    if (val.length < 2) { suggestCard.classList.add("is-hidden"); return; }
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${val}&count=5`);
        const data = await res.json();
        if (data.results) {
            fetchWeather(data.results[0].name); // Auto-Search first match
            suggestList.innerHTML = "";
            data.results.forEach(city => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                const displayFull = `${city.admin1 || ''}${city.admin1 ? ', ' : ''}${city.country || ''}`;
                div.textContent = `${city.name}, ${displayFull}`;
                div.onclick = () => {
                    fetchWeather(city.name, city.latitude, city.longitude, city.timezone, displayFull);
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
    if (currentData) render(document.getElementById("city-name").textContent, document.getElementById("full-location").textContent, currentData);
});