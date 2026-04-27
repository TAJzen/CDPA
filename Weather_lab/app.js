// Task 2: Weathercode Lookup [cite: 44]
const WEATHER_CODES = {
    0: "☀️ Clear", 1: "🌤️ Mainly Clear", 2: "⛅ Partly Cloudy", 3: "☁️ Overcast",
    45: "🌫️ Fog", 61: "🌧️ Slight Rain", 95: "⛈️ Thunderstorm"
};

// Task 4: Debounce [cite: 58-59]
const debounce = (fn, delay = 500) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

async function getWeather(city) {
    if (city.length < 2) return alert("Min 2 characters");
    
    // Task 4: 10s Timeout [cite: 59-63]
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
        $(".skeleton").addClass("skeleton"); // Show skeletons [cite: 24]
        $("#error-banner").addClass("hidden");

        // Step 1: Geocoding [cite: 37]
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`, { signal: controller.signal });
        if (!geo.ok) throw new Error(geo.status); // Task 4 [cite: 57]
        const geoData = await geo.json();
        
        if (!geoData.results) {
            $("#error-banner").removeClass("hidden");
            $("#error-text").text("City not found");
            return;
        }

        const { latitude, longitude, name, timezone } = geoData.results[0];

        // Step 2: Weather Forecast [cite: 39-40]
        const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`, { signal: controller.signal });
        const data = await weather.json();

        clearTimeout(timer);
        updateUI(name, data);
        
        // Task 3: jQuery Time Request [cite: 46-51]
        fetchTime(timezone);

    } catch (e) {
        $("#error-banner").removeClass("hidden");
        $("#error-text").text(e.name === 'AbortError' ? "Timeout" : "Error fetching data");
    }
}

function fetchTime(tz) {
    $.getJSON(`https://worldtimeapi.org/api/timezone/${tz}`)
        .done(data => $("#local-time").text(`Local Time: ${data.datetime.split('T')[1].substring(0,5)}`))
        .fail(() => $("#local-time").text(`Time: ${new Date().toLocaleTimeString()}`)) // Fallback [cite: 51]
        .always(() => console.log("Request Finished: " + new Date().toISOString())); // Log timestamp [cite: 51]
}

function updateUI(city, data) {
    $(".skeleton").removeClass("skeleton"); // Remove skeletons [cite: 41]
    $(".content").removeClass("hidden");
    
    $("#city-name").text(city);
    $("#temp").text(Math.round(data.current_weather.temperature) + "°C");
    $("#desc").text(WEATHER_CODES[data.current_weather.weathercode] || "Cloudy");
    
    $("#forecast-row").empty();
    data.daily.time.forEach((t, i) => {
        $("#forecast-row").append(`
            <div class="f-card">
                <p>${new Date(t).toLocaleDateString('en', {weekday:'short'})}</p>
                <p>${WEATHER_CODES[data.daily.weathercode[i]]?.split(' ')[0] || "☁️"}</p>
                <p>${Math.round(data.daily.temperature_2m_max[i])}°</p>
            </div>
        `);
    });
}

const search = debounce(() => getWeather($("#search-input").val()));
$("#search-btn").click(search);