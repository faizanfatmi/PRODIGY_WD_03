const cityInput = document.getElementById('cityInput');
const geoBtn = document.getElementById('geoBtn');
const loader = document.getElementById('loader');
const errorBanner = document.getElementById('errorBanner');
const errorMsg = document.getElementById('errorMsg');
const dashboard = document.getElementById('dashboard');
const unitToggle = document.getElementById('unitToggle');
const dynamicBg = document.getElementById('dynamicBg');

const elCity = document.getElementById('cityName');
const elDateTime = document.getElementById('dateTime');
const elIcon = document.getElementById('weatherIcon');
const elTemp = document.getElementById('temperature');
const elTempUnit = document.getElementById('tempUnit');
const elDesc = document.getElementById('description');
const elHeroHigh = document.getElementById('heroHigh');
const elHeroLow = document.getElementById('heroLow');
const elFeelsLike = document.getElementById('feelsLike');
const elHumidity = document.getElementById('humidity');
const elWind = document.getElementById('wind');
const elPressure = document.getElementById('pressure');
const elVisibility = document.getElementById('visibility');
const elSunriseSunset = document.getElementById('sunriseSunset');

const hourlyScroll = document.getElementById('hourlyScroll');
const dailyList = document.getElementById('dailyList');

const radarMap = document.getElementById('radarMap');
const radarBtns = document.querySelectorAll('.radar-btn');

const compassNeedle = document.getElementById('compassNeedle');
const windSpeed2 = document.getElementById('windSpeed2');
const windGust = document.getElementById('windGust');
const pressure2 = document.getElementById('pressure2');
const dewPoint = document.getElementById('dewPoint');
const uvIndex = document.getElementById('uvIndex');

const sunrise2 = document.getElementById('sunrise2');
const sunset2 = document.getElementById('sunset2');
const sunArcPath = document.getElementById('sunArcPath');
const sunDot = document.getElementById('sunDot');
const moonIcon = document.getElementById('moonIcon');
const moonPhase = document.getElementById('moonPhase');
const dayLength = document.getElementById('dayLength');

let useCelsius = true;
let rawData = null;
let currentCityName = '';
let currentLayer = 'precipitation_new';

const BG_IMAGES = {
    earlyMorning: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1920&q=80',
    morning: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&q=80',
    midday: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=1920&q=80',
    afternoon: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1920&q=80',
    evening: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80',
    night: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80',
    lateNight: 'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=1920&q=80',
};

function getBgKey(hour) {
    if (hour >= 5 && hour < 7) return 'earlyMorning';
    if (hour >= 7 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 13) return 'midday';
    if (hour >= 13 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    if (hour >= 20 && hour < 23) return 'night';
    return 'lateNight';
}

function setDynamicBackground(timezoneOffset) {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const localDate = new Date(utcMs + timezoneOffset * 1000);
    dynamicBg.style.backgroundImage = `url('${BG_IMAGES[getBgKey(localDate.getUTCHours())]}')`;
}

function showLoader() { loader.classList.add('active'); }
function hideLoader() { loader.classList.remove('active'); }
function showError(msg) { errorMsg.textContent = msg; errorBanner.classList.add('active'); }
function hideError() { errorBanner.classList.remove('active'); }
function showDashboard() { dashboard.classList.add('active'); }
function hideDashboard() { dashboard.classList.remove('active'); }

const WEATHER_EMOJI = {
    '01d': '☀️', '01n': '🌙',
    '02d': '🌤️', '02n': '☁️',
    '03d': '⛅', '03n': '⛅',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
};
function getWeatherEmoji(code) { return WEATHER_EMOJI[code] || '🌡️'; }
function toLocalTime(unix, tz) { return new Date((unix + tz) * 1000); }

function formatTime(date) {
    return date.getUTCHours().toString().padStart(2, '0') + ':' + date.getUTCMinutes().toString().padStart(2, '0');
}
function formatHour(date) {
    const h = date.getUTCHours();
    return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
}
function formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getUTCDay()]}, ${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
}

function kelvinTo(k) { return useCelsius ? (k - 273.15) : ((k - 273.15) * 9 / 5 + 32); }
function tempStr(k) { return Math.round(kelvinTo(k)); }
function unitSymbol() { return useCelsius ? '°C' : '°F'; }

function calcDewPoint(tempK, rh) {
    const tc = tempK - 273.15;
    const a = 17.27, b = 237.7;
    const gamma = (a * tc) / (b + tc) + Math.log(rh / 100);
    const dp = (b * gamma) / (a - gamma);
    return useCelsius ? Math.round(dp) : Math.round(dp * 9 / 5 + 32);
}

function getMoonPhaseName(phase) {
    if (phase === 0 || phase === 1) return { icon: '🌑', name: 'New Moon' };
    if (phase < 0.25) return { icon: '🌒', name: 'Waxing Crescent' };
    if (phase === 0.25) return { icon: '🌓', name: 'First Quarter' };
    if (phase < 0.5) return { icon: '🌔', name: 'Waxing Gibbous' };
    if (phase === 0.5) return { icon: '🌕', name: 'Full Moon' };
    if (phase < 0.75) return { icon: '🌖', name: 'Waning Gibbous' };
    if (phase === 0.75) return { icon: '🌗', name: 'Last Quarter' };
    return { icon: '🌘', name: 'Waning Crescent' };
}

function getMoonPhaseApprox() {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
    let c, e;
    if (m <= 2) { c = y - 1; e = m + 12; } else { c = y; e = m; }
    const jd = Math.floor(365.25 * (c + 4716)) + Math.floor(30.6001 * (e + 1)) + d - 1524.5;
    let phase = ((jd - 2451550.1) % 29.530588853) / 29.530588853;
    if (phase < 0) phase += 1;
    return getMoonPhaseName(phase);
}

async function fetchWeather(lat, lon, cityName) {
    hideError(); hideDashboard(); showLoader();

    try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Server error (${res.status})`);
        }

        const result = await res.json();
        rawData = result;
        currentCityName = cityName;

        if (result.source === 'onecall') {
            const d = result.data;
            setDynamicBackground(d.timezone_offset);
            renderCurrentOneCall(d);
            renderHourlyOneCall(d);
            renderDailyOneCall(d);
            renderWindOneCall(d);
            renderSunMoonOneCall(d);
        } else {
            setDynamicBackground(result.current.timezone);
            renderCurrentLegacy(result.current);
            renderHourlyLegacy(result.forecast);
            renderDailyLegacy(result.forecast);
            renderWindLegacy(result.current);
            renderSunMoonLegacy(result.current);
        }

        renderRadar();
        showDashboard();
    } catch (e) {
        showError(e.message || 'Unable to fetch weather data.');
    } finally {
        hideLoader();
    }
}

async function fetchByCity(city) {
    hideError(); showLoader();
    try {
        const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(city)}`);
        if (!geoRes.ok) {
            const err = await geoRes.json().catch(() => ({}));
            throw new Error(err.error || 'City not found.');
        }
        const geo = await geoRes.json();
        await fetchWeather(geo.lat, geo.lon, `${geo.name}, ${geo.country}`);
    } catch (e) {
        hideLoader();
        showError(e.message || 'Unable to fetch weather data.');
    }
}

async function fetchByCoords(lat, lon) {
    try {
        const geoRes = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
        const geo = await geoRes.json();
        await fetchWeather(lat, lon, geo.name || 'Unknown Location');
    } catch {
        await fetchWeather(lat, lon, 'Unknown Location');
    }
}

function renderCurrentOneCall(d) {
    const current = d.current;
    const tz = d.timezone_offset;

    elCity.textContent = currentCityName;
    const localNow = toLocalTime(current.dt, tz);
    elDateTime.textContent = `${formatDate(localNow)} • ${formatTime(localNow)}`;

    elIcon.textContent = getWeatherEmoji(current.weather[0].icon);
    elTemp.textContent = tempStr(current.temp);
    elTempUnit.textContent = unitSymbol();
    elDesc.textContent = current.weather[0].description;

    if (d.daily && d.daily.length > 0) {
        elHeroHigh.textContent = `H: ${tempStr(d.daily[0].temp.max)}°`;
        elHeroLow.textContent = `L: ${tempStr(d.daily[0].temp.min)}°`;
    }

    elFeelsLike.textContent = `${tempStr(current.feels_like)}${unitSymbol()}`;
    elHumidity.textContent = `${current.humidity}%`;
    elWind.textContent = `${current.wind_speed} m/s`;
    elPressure.textContent = `${current.pressure} hPa`;
    elVisibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;

    const sr = toLocalTime(current.sunrise, tz);
    const ss = toLocalTime(current.sunset, tz);
    elSunriseSunset.textContent = `${formatTime(sr)} / ${formatTime(ss)}`;
}

function renderCurrentLegacy(d) {
    elCity.textContent = currentCityName || `${d.name}, ${d.sys.country}`;
    const localNow = toLocalTime(d.dt, d.timezone);
    elDateTime.textContent = `${formatDate(localNow)} • ${formatTime(localNow)}`;

    elIcon.textContent = getWeatherEmoji(d.weather[0].icon);
    elTemp.textContent = tempStr(d.main.temp);
    elTempUnit.textContent = unitSymbol();
    elDesc.textContent = d.weather[0].description;

    elHeroHigh.textContent = `H: ${tempStr(d.main.temp_max)}°`;
    elHeroLow.textContent = `L: ${tempStr(d.main.temp_min)}°`;

    elFeelsLike.textContent = `${tempStr(d.main.feels_like)}${unitSymbol()}`;
    elHumidity.textContent = `${d.main.humidity}%`;
    elWind.textContent = `${d.wind.speed} m/s`;
    elPressure.textContent = `${d.main.pressure} hPa`;
    elVisibility.textContent = `${(d.visibility / 1000).toFixed(1)} km`;

    const sr = toLocalTime(d.sys.sunrise, d.timezone);
    const ss = toLocalTime(d.sys.sunset, d.timezone);
    elSunriseSunset.textContent = `${formatTime(sr)} / ${formatTime(ss)}`;
}

function renderHourlyOneCall(d) {
    hourlyScroll.innerHTML = '';
    const tz = d.timezone_offset;
    (d.hourly || []).slice(0, 24).forEach(item => {
        const dt = toLocalTime(item.dt, tz);
        const el = document.createElement('div');
        el.className = 'hourly-item';
        el.innerHTML = `
      <div class="hourly-time">${formatHour(dt)}</div>
      <span class="hourly-icon">${getWeatherEmoji(item.weather[0].icon)}</span>
      <div class="hourly-temp">${tempStr(item.temp)}°</div>
    `;
        hourlyScroll.appendChild(el);
    });
}

function renderHourlyLegacy(data) {
    hourlyScroll.innerHTML = '';
    const tz = rawData.current.timezone;
    data.list.slice(0, 8).forEach(item => {
        const dt = toLocalTime(item.dt, tz);
        const el = document.createElement('div');
        el.className = 'hourly-item';
        el.innerHTML = `
      <div class="hourly-time">${formatHour(dt)}</div>
      <span class="hourly-icon">${getWeatherEmoji(item.weather[0].icon)}</span>
      <div class="hourly-temp">${tempStr(item.main.temp)}°</div>
    `;
        hourlyScroll.appendChild(el);
    });
}

function renderDailyOneCall(d) {
    dailyList.innerHTML = '';
    const items = (d.daily || []).slice(1, 8);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let absMin = Infinity, absMax = -Infinity;
    items.forEach(i => { absMin = Math.min(absMin, i.temp.min); absMax = Math.max(absMax, i.temp.max); });

    items.forEach(item => {
        const dt = new Date(item.dt * 1000);
        const hi = item.temp.max, lo = item.temp.min;
        const range = absMax - absMin || 1;
        const barLeft = ((lo - absMin) / range) * 100;
        const barWidth = ((hi - lo) / range) * 100;

        const el = document.createElement('div');
        el.className = 'daily-item';
        el.innerHTML = `
      <span class="daily-day">${dayNames[dt.getUTCDay()]}</span>
      <span class="daily-icon">${getWeatherEmoji(item.weather[0].icon)}</span>
      <span class="daily-desc">${item.weather[0].description}</span>
      <div class="daily-bar-container">
        <div class="daily-bar" style="margin-left:${barLeft}%;width:${Math.max(barWidth, 8)}%"></div>
      </div>
      <div class="daily-temps">
        <span class="daily-lo">${tempStr(lo)}°</span>
        <span class="daily-hi">${tempStr(hi)}°</span>
      </div>
    `;
        dailyList.appendChild(el);
    });
}

function renderDailyLegacy(data) {
    dailyList.innerHTML = '';
    const daily = {};
    data.list.forEach(item => {
        const dt = new Date(item.dt * 1000);
        const key = dt.toISOString().slice(0, 10);
        if (!daily[key]) daily[key] = { highs: [], lows: [], icons: [], descs: [], dt };
        daily[key].highs.push(item.main.temp_max);
        daily[key].lows.push(item.main.temp_min);
        daily[key].icons.push(item.weather[0].icon);
        daily[key].descs.push(item.weather[0].description);
    });

    const today = new Date().toISOString().slice(0, 10);
    const keys = Object.keys(daily).filter(k => k !== today).slice(0, 5);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let absMin = Infinity, absMax = -Infinity;
    keys.forEach(k => {
        absMin = Math.min(absMin, ...daily[k].lows);
        absMax = Math.max(absMax, ...daily[k].highs);
    });

    keys.forEach(key => {
        const d = daily[key];
        const hi = Math.max(...d.highs), lo = Math.min(...d.lows);
        const range = absMax - absMin || 1;
        const barLeft = ((lo - absMin) / range) * 100;
        const barWidth = ((hi - lo) / range) * 100;
        const icon = d.icons[Math.floor(d.icons.length / 2)];
        const desc = d.descs[Math.floor(d.descs.length / 2)];

        const el = document.createElement('div');
        el.className = 'daily-item';
        el.innerHTML = `
      <span class="daily-day">${dayNames[d.dt.getUTCDay()]}</span>
      <span class="daily-icon">${getWeatherEmoji(icon)}</span>
      <span class="daily-desc">${desc}</span>
      <div class="daily-bar-container">
        <div class="daily-bar" style="margin-left:${barLeft}%;width:${Math.max(barWidth, 8)}%"></div>
      </div>
      <div class="daily-temps">
        <span class="daily-lo">${tempStr(lo)}°</span>
        <span class="daily-hi">${tempStr(hi)}°</span>
      </div>
    `;
        dailyList.appendChild(el);
    });
}

let leafletMap = null;
let weatherLayer = null;
let currentLat = 22;
let currentLon = 78;

function renderRadar() {
    if (!leafletMap) {
        leafletMap = L.map('radarMap', {
            center: [currentLat, currentLon],
            zoom: 6,
            zoomControl: true,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            opacity: 0.9
        }).addTo(leafletMap);
    }

    leafletMap.setView([currentLat, currentLon], 6);

    if (weatherLayer) {
        leafletMap.removeLayer(weatherLayer);
    }

    weatherLayer = L.tileLayer(`/api/tile/${currentLayer}/{z}/{x}/{y}`, {
        maxZoom: 18,
        opacity: 0.6,
        attribution: '© OpenWeatherMap'
    }).addTo(leafletMap);

    setTimeout(() => leafletMap.invalidateSize(), 300);
}

radarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        radarBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLayer = btn.dataset.layer;
        renderRadar();
    });
});

function renderWindOneCall(d) {
    const c = d.current;
    compassNeedle.style.transform = `translateX(-50%) rotate(${c.wind_deg || 0}deg)`;
    windSpeed2.textContent = c.wind_speed;
    windGust.textContent = c.wind_gust ? `${c.wind_gust} m/s` : '— m/s';
    pressure2.textContent = `${c.pressure} hPa`;

    if (c.dew_point !== undefined) {
        const dpVal = useCelsius ? Math.round(c.dew_point - 273.15) : Math.round((c.dew_point - 273.15) * 9 / 5 + 32);
        dewPoint.textContent = `${dpVal}${unitSymbol()}`;
    } else {
        dewPoint.textContent = `${calcDewPoint(c.temp, c.humidity)}${unitSymbol()}`;
    }

    uvIndex.textContent = c.uvi !== undefined ? c.uvi : 'N/A';
}

function renderWindLegacy(d) {
    compassNeedle.style.transform = `translateX(-50%) rotate(${d.wind.deg || 0}deg)`;
    windSpeed2.textContent = d.wind.speed;
    windGust.textContent = d.wind.gust ? `${d.wind.gust} m/s` : '— m/s';
    pressure2.textContent = `${d.main.pressure} hPa`;
    dewPoint.textContent = `${calcDewPoint(d.main.temp, d.main.humidity)}${unitSymbol()}`;
    uvIndex.textContent = 'N/A';
}

function renderSunMoonOneCall(d) {
    const c = d.current, tz = d.timezone_offset;
    const sr = toLocalTime(c.sunrise, tz);
    const ss = toLocalTime(c.sunset, tz);
    const now = toLocalTime(c.dt, tz);

    sunrise2.textContent = formatTime(sr);
    sunset2.textContent = formatTime(ss);

    const dlMs = (c.sunset - c.sunrise) * 1000;
    dayLength.textContent = `${Math.floor(dlMs / 3600000)}h ${Math.floor((dlMs % 3600000) / 60000)}m`;

    renderSunArc(sr, ss, now);

    if (d.daily && d.daily.length > 0 && d.daily[0].moon_phase !== undefined) {
        const moon = getMoonPhaseName(d.daily[0].moon_phase);
        moonIcon.textContent = moon.icon;
        moonPhase.textContent = moon.name;
    } else {
        const moon = getMoonPhaseApprox();
        moonIcon.textContent = moon.icon;
        moonPhase.textContent = moon.name;
    }
}

function renderSunMoonLegacy(d) {
    const tz = d.timezone;
    const sr = toLocalTime(d.sys.sunrise, tz);
    const ss = toLocalTime(d.sys.sunset, tz);
    const now = toLocalTime(d.dt, tz);

    sunrise2.textContent = formatTime(sr);
    sunset2.textContent = formatTime(ss);

    const dlMs = (d.sys.sunset - d.sys.sunrise) * 1000;
    dayLength.textContent = `${Math.floor(dlMs / 3600000)}h ${Math.floor((dlMs % 3600000) / 60000)}m`;

    renderSunArc(sr, ss, now);

    const moon = getMoonPhaseApprox();
    moonIcon.textContent = moon.icon;
    moonPhase.textContent = moon.name;
}

function renderSunArc(sr, ss, now) {
    const sunriseMs = sr.getTime(), sunsetMs = ss.getTime(), nowMs = now.getTime();
    let progress = 0;
    if (nowMs >= sunriseMs && nowMs <= sunsetMs) progress = (nowMs - sunriseMs) / (sunsetMs - sunriseMs);
    else if (nowMs > sunsetMs) progress = 1;

    const arcPath = document.getElementById('sunArcPath');
    const totalLen = arcPath.getTotalLength ? arcPath.getTotalLength() : 290;
    arcPath.style.strokeDasharray = `${totalLen * progress} ${totalLen}`;

    if (arcPath.getPointAtLength) {
        const pt = arcPath.getPointAtLength(totalLen * progress);
        sunDot.setAttribute('cx', pt.x);
        sunDot.setAttribute('cy', pt.y);
    }
}

unitToggle.addEventListener('click', () => {
    useCelsius = !useCelsius;
    unitToggle.textContent = useCelsius ? '°C' : '°F';
    if (!rawData) return;

    if (rawData.source === 'onecall') {
        const d = rawData.data;
        renderCurrentOneCall(d);
        renderHourlyOneCall(d);
        renderDailyOneCall(d);
        renderWindOneCall(d);
        renderSunMoonOneCall(d);
    } else {
        renderCurrentLegacy(rawData.current);
        renderHourlyLegacy(rawData.forecast);
        renderDailyLegacy(rawData.forecast);
        renderWindLegacy(rawData.current);
        renderSunMoonLegacy(rawData.current);
    }
});

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchByCity(city);
    }
});

geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return showError('Geolocation not supported by your browser.');
    navigator.geolocation.getCurrentPosition(
        pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        () => showError('Location access denied. Please search manually.')
    );
});

(function init() {
    dynamicBg.style.backgroundImage = `url('${BG_IMAGES[getBgKey(new Date().getHours())]}')`;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
            () => { }
        );
    }
})();
