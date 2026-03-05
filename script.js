const API_KEY = '76bdb76f325de3be9c3442b9d711225c';
const BASE_ONECALL = 'https://api.openweathermap.org/data/3.0/onecall';
const BASE_CURRENT = 'https://api.openweathermap.org/data/2.5/weather';
const BASE_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';
const BASE_GEO = 'https://api.openweathermap.org/geo/1.0/direct';

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
let useOneCall = true;
let currentCityName = '';
let currentLat = 22;
let currentLon = 78;
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

function setDynamicBackground(timezoneOffset) {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const localDate = new Date(utcMs + timezoneOffset * 1000);
  const hour = localDate.getUTCHours();

  let bgKey;
  if (hour >= 5 && hour < 7) bgKey = 'earlyMorning';
  else if (hour >= 7 && hour < 10) bgKey = 'morning';
  else if (hour >= 10 && hour < 13) bgKey = 'midday';
  else if (hour >= 13 && hour < 17) bgKey = 'afternoon';
  else if (hour >= 17 && hour < 20) bgKey = 'evening';
  else if (hour >= 20 && hour < 23) bgKey = 'night';
  else bgKey = 'lateNight';

  dynamicBg.style.backgroundImage = `url('${BG_IMAGES[bgKey]}')`;
}

function showLoader() { loader.classList.add('active'); }
function hideLoader() { loader.classList.remove('active'); }
function showError(msg) { errorMsg.textContent = msg; errorBanner.classList.add('active'); }
function hideError() { errorBanner.classList.remove('active'); }
function showDashboard() { dashboard.classList.add('active'); }
function hideDashboard() { dashboard.classList.remove('active'); }

function iconUrl(code) { return `https://openweathermap.org/img/wn/${code}@2x.png`; }
function iconUrl2x(code) { return `https://openweathermap.org/img/wn/${code}@2x.png`; }

function toLocalTime(unix, tz) { return new Date((unix + tz) * 1000); }

function formatTime(date) {
  return date.getUTCHours().toString().padStart(2, '0') + ':' + date.getUTCMinutes().toString().padStart(2, '0');
}
function formatHour(date) {
  const h = date.getUTCHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh} ${ampm}`;
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
  else if (phase < 0.25) return { icon: '🌒', name: 'Waxing Crescent' };
  else if (phase === 0.25) return { icon: '🌓', name: 'First Quarter' };
  else if (phase < 0.5) return { icon: '🌔', name: 'Waxing Gibbous' };
  else if (phase === 0.5) return { icon: '🌕', name: 'Full Moon' };
  else if (phase < 0.75) return { icon: '🌖', name: 'Waning Gibbous' };
  else if (phase === 0.75) return { icon: '🌗', name: 'Last Quarter' };
  else return { icon: '🌘', name: 'Waning Crescent' };
}

function getMoonPhaseApprox() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  let c = 0, e = 0;
  if (month <= 2) { c = year - 1; e = month + 12; } else { c = year; e = month; }
  const jd = Math.floor(365.25 * (c + 4716)) + Math.floor(30.6001 * (e + 1)) + day - 1524.5;
  const daysSinceNew = (jd - 2451550.1) % 29.530588853;
  const phase = daysSinceNew / 29.530588853;
  return getMoonPhaseName(phase < 0 ? phase + 1 : phase);
}

async function geocodeCity(city) {
  const url = `${BASE_GEO}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed.');
  const data = await res.json();
  if (!data.length) throw new Error('City not found. Please check the name.');
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
}

async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return 'Unknown Location';
    const data = await res.json();
    if (!data.length) return 'Unknown Location';
    return `${data[0].name}, ${data[0].country}`;
  } catch { return 'Unknown Location'; }
}

async function fetchOneCall(lat, lon) {
  const url = `${BASE_ONECALL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      useOneCall = false;
      console.warn('OneCall 3.0 not available (401). Falling back to 2.5 API.');
      return null;
    }
    throw new Error(err.message || `API error (${res.status})`);
  }
  return await res.json();
}

async function fetchLegacy(lat, lon) {
  const qs = new URLSearchParams({ lat, lon, appid: API_KEY });
  const [curRes, fcRes] = await Promise.all([
    fetch(`${BASE_CURRENT}?${qs}`),
    fetch(`${BASE_FORECAST}?${qs}`)
  ]);
  if (!curRes.ok) {
    const err = await curRes.json().catch(() => ({}));
    throw new Error(err.message || `City not found (${curRes.status})`);
  }
  const curData = await curRes.json();
  const fcData = await fcRes.json();
  return { current: curData, forecast: fcData, api: '2.5' };
}

async function fetchWeather(lat, lon, cityName) {
  hideError(); hideDashboard(); showLoader();

  try {
    let data;

    if (useOneCall) {
      data = await fetchOneCall(lat, lon);
    }

    if (!data) {
      data = await fetchLegacy(lat, lon);
    }

    rawData = data;
    currentLat = lat;
    currentLon = lon;
    currentCityName = cityName;

    if (data.api === '2.5') {
      setDynamicBackground(data.current.timezone);
      renderCurrentLegacy(data.current);
      renderHourlyLegacy(data.forecast);
      renderDailyLegacy(data.forecast);
      renderWindLegacy(data.current);
      renderSunMoonLegacy(data.current);
    } else {
      setDynamicBackground(data.timezone_offset);
      renderCurrentOneCall(data);
      renderHourlyOneCall(data);
      renderDailyOneCall(data);
      renderWindOneCall(data);
      renderSunMoonOneCall(data);
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
    const geo = await geocodeCity(city);
    await fetchWeather(geo.lat, geo.lon, `${geo.name}, ${geo.country}`);
  } catch (e) {
    hideLoader();
    showError(e.message || 'Unable to fetch weather data.');
  }
}

async function fetchByCoords(lat, lon) {
  const cityName = await reverseGeocode(lat, lon);
  await fetchWeather(lat, lon, cityName);
}

function renderCurrentOneCall(d) {
  const current = d.current;
  const tz = d.timezone_offset;

  elCity.textContent = currentCityName;
  const localNow = toLocalTime(current.dt, tz);
  elDateTime.textContent = `${formatDate(localNow)} • ${formatTime(localNow)}`;

  elIcon.src = iconUrl(current.weather[0].icon);
  elIcon.alt = current.weather[0].description;
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

  elIcon.src = iconUrl(d.weather[0].icon);
  elIcon.alt = d.weather[0].description;
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
  const items = d.hourly ? d.hourly.slice(0, 24) : [];

  items.forEach(item => {
    const dt = toLocalTime(item.dt, tz);
    const el = document.createElement('div');
    el.className = 'hourly-item';
    el.innerHTML = `
      <div class="hourly-time">${formatHour(dt)}</div>
      <img class="hourly-icon" src="${iconUrl2x(item.weather[0].icon)}" alt="${item.weather[0].description}" />
      <div class="hourly-temp">${tempStr(item.temp)}°</div>
    `;
    hourlyScroll.appendChild(el);
  });
}

function renderHourlyLegacy(data) {
  hourlyScroll.innerHTML = '';
  const tz = rawData.current.timezone;
  const items = data.list.slice(0, 8);

  items.forEach(item => {
    const dt = toLocalTime(item.dt, tz);
    const el = document.createElement('div');
    el.className = 'hourly-item';
    el.innerHTML = `
      <div class="hourly-time">${formatHour(dt)}</div>
      <img class="hourly-icon" src="${iconUrl2x(item.weather[0].icon)}" alt="${item.weather[0].description}" />
      <div class="hourly-temp">${tempStr(item.main.temp)}°</div>
    `;
    hourlyScroll.appendChild(el);
  });
}

function renderDailyOneCall(d) {
  dailyList.innerHTML = '';
  const dailyItems = d.daily ? d.daily.slice(1, 8) : [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let absMin = Infinity, absMax = -Infinity;
  dailyItems.forEach(item => {
    absMin = Math.min(absMin, item.temp.min);
    absMax = Math.max(absMax, item.temp.max);
  });

  dailyItems.forEach(item => {
    const dt = new Date(item.dt * 1000);
    const hi = item.temp.max;
    const lo = item.temp.min;
    const range = absMax - absMin || 1;
    const barLeft = ((lo - absMin) / range) * 100;
    const barWidth = ((hi - lo) / range) * 100;

    const el = document.createElement('div');
    el.className = 'daily-item';
    el.innerHTML = `
      <span class="daily-day">${dayNames[dt.getUTCDay()]}</span>
      <img class="daily-icon" src="${iconUrl2x(item.weather[0].icon)}" alt="${item.weather[0].description}" />
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
  keys.forEach(key => {
    absMin = Math.min(absMin, ...daily[key].lows);
    absMax = Math.max(absMax, ...daily[key].highs);
  });

  keys.forEach(key => {
    const d = daily[key];
    const hi = Math.max(...d.highs);
    const lo = Math.min(...d.lows);
    const range = absMax - absMin || 1;
    const barLeft = ((lo - absMin) / range) * 100;
    const barWidth = ((hi - lo) / range) * 100;
    const icon = d.icons[Math.floor(d.icons.length / 2)];
    const desc = d.descs[Math.floor(d.descs.length / 2)];
    const dayName = dayNames[d.dt.getUTCDay()];

    const el = document.createElement('div');
    el.className = 'daily-item';
    el.innerHTML = `
      <span class="daily-day">${dayName}</span>
      <img class="daily-icon" src="${iconUrl2x(icon)}" alt="${desc}" />
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

function renderRadar() {
  radarMap.innerHTML = '';
  const zoom = 5;
  const tileCoords = [
    [22, 12], [23, 12], [24, 12], [25, 12],
    [22, 13], [23, 13], [24, 13], [25, 13],
    [22, 14], [23, 14], [24, 14], [25, 14],
  ];

  tileCoords.forEach(([x, y]) => {
    const img = document.createElement('img');
    img.src = `https://tile.openweathermap.org/map/${currentLayer}/${zoom}/${x}/${y}.png?appid=${API_KEY}`;
    img.alt = 'radar tile';
    img.loading = 'lazy';
    radarMap.appendChild(img);
  });
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
  const current = d.current;
  compassNeedle.style.transform = `translateX(-50%) rotate(${current.wind_deg || 0}deg)`;
  windSpeed2.textContent = current.wind_speed;
  windGust.textContent = current.wind_gust ? `${current.wind_gust} m/s` : '— m/s';
  pressure2.textContent = `${current.pressure} hPa`;

  if (current.dew_point !== undefined) {
    const dpVal = useCelsius ? Math.round(current.dew_point - 273.15) : Math.round((current.dew_point - 273.15) * 9 / 5 + 32);
    dewPoint.textContent = `${dpVal}${unitSymbol()}`;
  } else {
    dewPoint.textContent = `${calcDewPoint(current.temp, current.humidity)}${unitSymbol()}`;
  }

  uvIndex.textContent = current.uvi !== undefined ? current.uvi : 'N/A';
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
  const current = d.current;
  const tz = d.timezone_offset;
  const sr = toLocalTime(current.sunrise, tz);
  const ss = toLocalTime(current.sunset, tz);
  const now = toLocalTime(current.dt, tz);

  sunrise2.textContent = formatTime(sr);
  sunset2.textContent = formatTime(ss);

  const dlMs = (current.sunset - current.sunrise) * 1000;
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
  const sunriseMs = sr.getTime();
  const sunsetMs = ss.getTime();
  const nowMs = now.getTime();
  let progress = 0;
  if (nowMs >= sunriseMs && nowMs <= sunsetMs) {
    progress = (nowMs - sunriseMs) / (sunsetMs - sunriseMs);
  } else if (nowMs > sunsetMs) {
    progress = 1;
  }

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
  if (rawData) {
    if (rawData.api === '2.5') {
      renderCurrentLegacy(rawData.current);
      renderHourlyLegacy(rawData.forecast);
      renderDailyLegacy(rawData.forecast);
      renderWindLegacy(rawData.current);
      renderSunMoonLegacy(rawData.current);
    } else {
      renderCurrentOneCall(rawData);
      renderHourlyOneCall(rawData);
      renderDailyOneCall(rawData);
      renderWindOneCall(rawData);
      renderSunMoonOneCall(rawData);
    }
  }
});

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) fetchByCity(city);
  }
});

geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Geolocation not supported by your browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
    () => showError('Location access denied. Please search manually.')
  );
});

(function init() {
  const hour = new Date().getHours();
  let bgKey;
  if (hour >= 5 && hour < 7) bgKey = 'earlyMorning';
  else if (hour >= 7 && hour < 10) bgKey = 'morning';
  else if (hour >= 10 && hour < 13) bgKey = 'midday';
  else if (hour >= 13 && hour < 17) bgKey = 'afternoon';
  else if (hour >= 17 && hour < 20) bgKey = 'evening';
  else if (hour >= 20 && hour < 23) bgKey = 'night';
  else bgKey = 'lateNight';
  dynamicBg.style.backgroundImage = `url('${BG_IMAGES[bgKey]}')`;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => { }
    );
  }
})();
