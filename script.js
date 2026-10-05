const rawApiBase = "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname ? "http://localhost:5000" : "https://nepal-weather-forecast-backend.onrender.com";
const API_BASE = rawApiBase.replace(/\/+$/, "");
let currentLat = "27.7000", currentLon = "83.4500";

// --- BUILT-IN NEPAL LOCATIONS DATABASE FOR INSTANT SEARCH ---
const NEPAL_PRESET_LOCATIONS = [
  { name: "Kathmandu, Bagmati, Nepal", lat: "27.7172", lon: "85.3240" },
  { name: "Pokhara, Gandaki, Nepal", lat: "28.2096", lon: "83.9856" },
  { name: "Butwal, Lumbini, Nepal", lat: "27.7000", lon: "83.4500" },
  { name: "Lalitpur (Patan), Bagmati, Nepal", lat: "27.6667", lon: "85.3167" },
  { name: "Bhaktapur, Bagmati, Nepal", lat: "27.6710", lon: "85.4298" },
  { name: "Bharatpur, Chitwan, Bagmati, Nepal", lat: "27.6833", lon: "84.4333" },
  { name: "Biratnagar, Koshi, Nepal", lat: "26.4525", lon: "87.2718" },
  { name: "Birgunj, Madhesh, Nepal", lat: "27.0000", lon: "84.8667" },
  { name: "Dhangadhi, Sudurpashchim, Nepal", lat: "28.6833", lon: "80.6000" },
  { name: "Dharan, Koshi, Nepal", lat: "26.8125", lon: "87.2833" },
  { name: "Janakpur, Madhesh, Nepal", lat: "26.7167", lon: "85.9167" },
  { name: "Hetauda, Bagmati, Nepal", lat: "27.4167", lon: "85.0333" },
  { name: "Itahari, Koshi, Nepal", lat: "26.6667", lon: "87.2833" },
  { name: "Nepalgunj, Lumbini, Nepal", lat: "28.0500", lon: "81.6167" },
  { name: "Tansen, Palpa, Lumbini, Nepal", lat: "27.8667", lon: "83.5500" },
  { name: "Birendranagar, Surkhet, Karnali, Nepal", lat: "28.6000", lon: "81.6333" },
  { name: "Gorkha, Gandaki, Nepal", lat: "28.0000", lon: "84.6333" },
  { name: "Bandipur, Tanahun, Gandaki, Nepal", lat: "27.9333", lon: "84.4167" },
  { name: "Jomsom, Mustang, Gandaki, Nepal", lat: "28.7833", lon: "83.7333" },
  { name: "Muktinath, Mustang, Gandaki, Nepal", lat: "28.8167", lon: "83.8667" },
  { name: "Lukla, Everest Region, Koshi, Nepal", lat: "27.6881", lon: "86.7314" },
  { name: "Namche Bazaar, Everest Region, Koshi, Nepal", lat: "27.8000", lon: "86.7167" },
  { name: "Nagarkot, Bhaktapur, Bagmati, Nepal", lat: "27.7175", lon: "85.5200" },
  { name: "Dhulikhel, Kavre, Bagmati, Nepal", lat: "27.6250", lon: "85.5500" },
  { name: "Ilam, Koshi, Nepal", lat: "26.9083", lon: "87.9281" },
  { name: "Birtamode, Jhapa, Koshi, Nepal", lat: "26.6433", lon: "87.9869" },
  { name: "Lahan, Siraha, Madhesh, Nepal", lat: "26.7167", lon: "86.4833" },
  { name: "Rajbiraj, Saptari, Madhesh, Nepal", lat: "26.5333", lon: "86.7500" },
  { name: "Banepa, Kavre, Bagmati, Nepal", lat: "27.6333", lon: "85.5167" },
  { name: "Kirtipur, Kathmandu, Bagmati, Nepal", lat: "27.6833", lon: "85.2833" },
  { name: "Lumbini, Rupandehi, Lumbini, Nepal", lat: "27.4833", lon: "83.2833" },
  { name: "Siddharthanagar (Bhairahawa), Lumbini, Nepal", lat: "27.5000", lon: "83.4500" },
  { name: "Tikapur, Kailali, Sudurpashchim, Nepal", lat: "28.5000", lon: "81.1333" },
  { name: "Damak, Jhapa, Koshi, Nepal", lat: "26.6667", lon: "87.7000" },
  { name: "Inaruwa, Sunsari, Koshi, Nepal", lat: "26.6000", lon: "87.1500" },
  { name: "Tulsipur, Dang, Lumbini, Nepal", lat: "28.1333", lon: "82.3000" },
  { name: "Ghorahi, Dang, Lumbini, Nepal", lat: "28.0333", lon: "82.5000" },
  { name: "Kalaiya, Bara, Madhesh, Nepal", lat: "27.0333", lon: "85.0000" },
  { name: "Malangwa, Sarlahi, Madhesh, Nepal", lat: "26.8500", lon: "85.5500" },
  { name: "Jaleshwar, Mahottari, Madhesh, Nepal", lat: "26.6500", lon: "85.8000" }
];

// --- INSTANT CACHE RENDERERS ---

function renderCachedCurrent(data) {
  if (!data) return;
  const setEl = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.textContent = val; };
  setEl("currentTemp", data.temperature !== undefined ? data.temperature : "--");
  setEl("currentCondition", data.condition || "");
  setEl("feelsLike", data.feelsLike !== undefined ? data.feelsLike : "--");
  setEl("humidity", data.humidity !== undefined ? data.humidity : "--");
  setEl("uvIndex", (data.uvIndex !== undefined && data.uvIndex !== null) ? data.uvIndex : "0");
  setEl("precipitation", data.precipChance !== undefined ? data.precipChance : "0");

  const savedName = localStorage.getItem("savedLocationName");
  const locTitle = document.getElementById("locationTitle");

  if (locTitle) {
  let displayName = "Butwal, Nepal"; // Default fallback city

  if (savedName && savedName.trim() !== "" && savedName !== "Current Location" && savedName !== "undefined" && savedName !== "null") {
    displayName = savedName;
  } else if (data.cityName && data.cityName.trim() !== "" && data.cityName !== "Current Location" && data.cityName !== "undefined" && data.cityName !== "null") {
    displayName = data.cityName;
  }

  // Extract the city name before the first comma (e.g., "Kathmandu, Bagmati" -> "Kathmandu")
  const idx = displayName.indexOf(",");
  locTitle.textContent = idx !== -1 ? displayName.substring(0, idx).trim() : displayName;
}
  // if (locTitle) {
  //   if (savedName && savedName !== "Current Location") {
  //     const idx = savedName.indexOf(",");
  //     locTitle.textContent = idx !== -1 ? savedName.substring(0, idx).trim() : savedName;
  //   } else if (data.cityName && data.cityName !== "Current Location") {
  //     locTitle.textContent = data.cityName;
  //   }
  // }

  const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  const locSub = document.getElementById("locationSub");
  if (locSub && data.region) {
    locSub.innerHTML = `${data.region} &bull; As of <span id="updateTime">${timeStr}</span>`;
  } else {
    const updateTimeEl = document.getElementById("updateTime");
    if (updateTimeEl) updateTimeEl.textContent = timeStr;
  }

  if (data.iconCode !== undefined) {
    const iconPath = getWeatherIconPath(data.iconCode);
    window.currentWeatherIconUrl = iconPath;
    const curIcon = document.getElementById("currentWeatherIcon");
    if (curIcon) curIcon.src = iconPath;
    const nowIcon = document.getElementById("nowHourlyIcon");
    if (nowIcon) nowIcon.src = iconPath;
  }
}

function renderCachedMetrics(data) {
  if (!data) return;
  const setEl = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.textContent = val; };
  setEl("metricTemp", data.temperature !== undefined ? `${data.temperature}°` : "");
  setEl("metricMaxMin", (data.tempMin !== undefined && data.tempMax !== undefined) ? `${data.tempMin}° / ${data.tempMax}°` : "");
  setEl("metricFeelsLike", data.feelsLike !== undefined ? `${data.feelsLike}°` : "");
  setEl("metricWindSpeed", data.windSpeed !== undefined ? `${data.windSpeed} km/h` : "");
  setEl("metricWindDir", data.windDirText || "");
  setEl("metricHumidity", data.humidity !== undefined ? `${data.humidity}%` : "");
  setEl("metricUvIndex", (data.uvIndex !== undefined && data.uvIndex !== null) ? data.uvIndex : "0");
  setEl("metricUvDesc", data.uvDescription || "Low");
  setEl("metricAirQuality", (data.airQuality !== undefined && data.airQuality !== null) ? data.airQuality : "--");
  setEl("metricDewPoint", data.dewPoint !== undefined ? `${data.dewPoint}°` : "");
  setEl("metricPressure", data.pressure !== undefined ? `${data.pressure} mb` : "");
  setEl("metricVisibility", data.visibility !== undefined ? `${data.visibility} km` : "");
  setEl("metricSunrise", data.sunrise || "--");
  setEl("metricSunset", data.sunset || "--");
  setEl("metricMoonrise", data.moonrise || "--");
  setEl("metricMoonset", data.moonset || "--");
  setEl("metricMoonPhase", data.moonPhase || "--");
}

function renderCachedInsight(text) {
  if (!text) return;
  const el = document.getElementById("weatherInsight");
  if (el) el.innerHTML = `<p>${text}</p>`;
}

function renderCachedHourly(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  const container = document.getElementById("hourlyForecast");
  if (!container) return;
  window.latestHourlyData = list;
  container.innerHTML = "";

  const now = new Date();
  const currentHour = now.getHours();

  // 1. Current Weather "Now" Card
  const curTempEl = document.getElementById("currentTemp");
  const nowTemp = (curTempEl && curTempEl.textContent && curTempEl.textContent !== "--")
    ? curTempEl.textContent
    : (list[0].temperature ?? list[0].temp ?? "--");

  const curIconEl = document.getElementById("currentWeatherIcon");
  const mainIconSrc = (curIconEl && curIconEl.src && curIconEl.src.indexOf('icons/') !== -1)
    ? curIconEl.src
    : (window.currentWeatherIconUrl || getWeatherIconPath(list[0].iconCode ?? 44, currentHour));

  const firstPrecip = list[0].precipChance ?? list[0].pop ?? 0;
  const pVal = Math.round(parseInt(String(firstPrecip).replace(/[^0-9]/g, ""), 10) || 0);
  const badgeHtml = pVal > 0 ? `<div class="precip-badge"><span class="drop-icon">💧</span>${pVal}%</div>` : "";

  const nowCard = document.createElement("div");
  nowCard.className = "hourly-card";
  nowCard.innerHTML = `
    <p class="time"><strong>Now</strong></p>
    <img id="nowHourlyIcon" src="${mainIconSrc}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
    <p class="temp">${nowTemp}°C</p>
    ${badgeHtml}
  `;
  container.appendChild(nowCard);

  // 2. Subsequent Hourly Cards for Upcoming Hours (4 PM, 5 PM, 6 PM...)
  const thirtyMinsAgoMs = now.getTime() - (30 * 60 * 1000);
  const renderedHours = new Set([currentHour]); // Mark current hour as already represented by "Now"

  list.forEach((item, idx) => {
    if (!item) return;

    let itemDate = null;
    if (item.time) {
      const d = new Date(item.time);
      if (!isNaN(d.getTime())) itemDate = d;
    }

    // Skip past hours
    if (itemDate && itemDate.getTime() < thirtyMinsAgoMs) return;

    let targetHour = null;
    let timeStr = "";

    if (itemDate) {
      targetHour = itemDate.getHours();
      // Skip if this hour matches current hour (already shown as "Now")
      if (renderedHours.has(targetHour)) return;
      renderedHours.add(targetHour);
      timeStr = itemDate.toLocaleTimeString([], { hour: "numeric", hour12: true });
    } else {
      const fallbackDate = new Date();
      fallbackDate.setMinutes(0, 0, 0);
      fallbackDate.setHours(fallbackDate.getHours() + idx + 1);
      targetHour = fallbackDate.getHours();
      if (renderedHours.has(targetHour)) return;
      renderedHours.add(targetHour);
      timeStr = fallbackDate.toLocaleTimeString([], { hour: "numeric", hour12: true });
    }

    const temp = item.temperature ?? item.temp ?? "--";
    const pop = Math.round(parseInt(String(item.precipChance ?? item.pop ?? 0).replace(/[^0-9]/g, ""), 10) || 0);
    const popHtml = pop > 0 ? `<div class="precip-badge"><span class="drop-icon">💧</span>${pop}%</div>` : "";
    const cardIcon = getWeatherIconPath(item.iconCode ?? item.wxIcon, targetHour);

    const card = document.createElement("div");
    card.className = "hourly-card";
    card.innerHTML = `
      <p class="time"><strong>${timeStr}</strong></p>
      <img src="${cardIcon}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
      <p class="temp">${temp}°C</p>
      ${popHtml}
    `;
    container.appendChild(card);
  });
}

function renderCachedDaily(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  const container = document.getElementById("dailyForecast");
  if (!container) return;
  container.innerHTML = "";

  list.forEach((item) => {
    const iconPath = getWeatherIconPath(item.iconCode, 12); // Daytime forecast for daily cards
    let pop = item.precipChance || 0;
    const badgeHtml = pop > 0 ? `<div class="precip-badge"><span class="drop-icon">💧</span>${pop}%</div>` : "";

    const card = document.createElement("div");
    card.className = "daily-card";
    card.innerHTML = `
      <p class="day-name"><strong>${item.day || "N/A"}</strong></p>
      <img src="${iconPath}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
      <p class="temps">High: ${item.tempMax}°C | Low: ${item.tempMin}°C</p>
      <p class="condition-text">${item.condition || ""}</p>
      ${badgeHtml}
    `;
    container.appendChild(card);
  });
}

// --- FETCH FUNCTIONS WITH INSTANT CACHE & ASYNC UPDATE ---

async function loadHourlyForecast(lat, lon) {
  const n = lat !== undefined ? lat : currentLat;
  const r = lon !== undefined ? lon : currentLon;
  const cacheKey = `nwf_cache_hourly_${n}_${r}`;

  try {
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem('nwf_cache_hourly');
    if (cached) renderCachedHourly(JSON.parse(cached));
  } catch(e) {}

  try {
    const resp = await fetch(`${API_BASE}/api/hourly-forecast?lat=${n}&lon=${r}`);
    const json = await resp.json();
    if (json.success && json.data) {
      const list = Array.isArray(json.data) ? json.data : (json.data.hourly || Object.values(json.data)[0]);
      if (Array.isArray(list) && list.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(list));
        localStorage.setItem('nwf_cache_hourly', JSON.stringify(list));
        renderCachedHourly(list);
      }
    }
  } catch(f) { console.error("Failed to load hourly forecast:", f); }
}

async function loadDailyForecast(lat, lon) {
  const n = lat !== undefined ? lat : currentLat;
  const r = lon !== undefined ? lon : currentLon;
  const cacheKey = `nwf_cache_daily_${n}_${r}`;

  try {
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem('nwf_cache_daily');
    if (cached) renderCachedDaily(JSON.parse(cached));
  } catch(e) {}

  try {
    const resp = await fetch(`${API_BASE}/api/daily-forecast?lat=${n}&lon=${r}`);
    const json = await resp.json();
    if (json.success && Array.isArray(json.data)) {
      localStorage.setItem(cacheKey, JSON.stringify(json.data));
      localStorage.setItem('nwf_cache_daily', JSON.stringify(json.data));
      renderCachedDaily(json.data);
    }
  } catch(c) { console.error("Failed to load daily forecast:", c); }
}

async function loadCurrentWeather(lat, lon) {
  const n = lat !== undefined ? lat : currentLat;
  const r = lon !== undefined ? lon : currentLon;
  const cacheKey = `nwf_cache_current_${n}_${r}`;

  try {
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem('nwf_cache_current');
    if (cached) renderCachedCurrent(JSON.parse(cached));
  } catch(e) {}

  try {
    const [weatherRes, rainRes] = await Promise.all([
      fetch(`${API_BASE}/api/current-weather?lat=${n}&lon=${r}`),
      fetch(`${API_BASE}/api/hourly-rain?lat=${n}&lon=${r}`).catch(() => null)
    ]);
    if (!weatherRes.ok) return;
    const json = await weatherRes.json();
    if (json.success && json.data) {
      const data = json.data;
      if (rainRes && rainRes.ok) {
        const rainJson = await rainRes.json();
        if (rainJson.success && Array.isArray(rainJson.data) && rainJson.data.length > 0) {
          data.precipChance = rainJson.data[0].precipChance ?? rainJson.data[0].pop ?? data.precipChance;
        }
      }
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem('nwf_cache_current', JSON.stringify(data));
      renderCachedCurrent(data);
    }
  } catch(f) { console.error("Failed to load current weather:", f); }
}

async function loadWeatherMetrics(lat, lon) {
  const n = lat !== undefined ? lat : currentLat;
  const r = lon !== undefined ? lon : currentLon;
  const cacheKey = `nwf_cache_metrics_${n}_${r}`;

  try {
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem('nwf_cache_metrics');
    if (cached) renderCachedMetrics(JSON.parse(cached));
  } catch(e) {}

  try {
    const resp = await fetch(`${API_BASE}/api/weather-metrics?lat=${n}&lon=${r}`);
    if (!resp.ok) return;
    const json = await resp.json();
    if (json.success && json.data) {
      localStorage.setItem(cacheKey, JSON.stringify(json.data));
      localStorage.setItem('nwf_cache_metrics', JSON.stringify(json.data));
      renderCachedMetrics(json.data);
    }
  } catch(l) { console.error("[Metrics Error]", l); }
}

async function loadInsights(lat, lon) {
  const n = lat !== undefined ? lat : currentLat;
  const r = lon !== undefined ? lon : currentLon;
  const cacheKey = `nwf_cache_insight_${n}_${r}`;

  try {
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem('nwf_cache_insight');
    if (cached) renderCachedInsight(cached);
  } catch(e) {}

  try {
    const resp = await fetch(`${API_BASE}/api/insights?lat=${n}&lon=${r}`);
    const json = await resp.json();
    if (json.success && json.insight) {
      localStorage.setItem(cacheKey, json.insight);
      localStorage.setItem('nwf_cache_insight', json.insight);
      renderCachedInsight(json.insight);
    }
  } catch(c) {}
}

async function loadPrecipitationInsight(lat, lon) {
  const n = lat !== undefined ? lat : currentLat;
  const r = lon !== undefined ? lon : currentLon;
  const container = document.getElementById("rainChartSection") || document.querySelector(".precipitation-section");
  if (!container) return;
  try {
    const [pRes, rRes] = await Promise.all([
      fetch(`${API_BASE}/api/precipitation-insight?lat=${n}&lon=${r}`).catch(() => null),
      fetch(`${API_BASE}/api/hourly-rain?lat=${n}&lon=${r}`).catch(() => null)
    ]);
    let active = false;
    let text = "";
    if (rRes && rRes.ok) {
      const rData = await rRes.json();
      if (rData.success && Array.isArray(rData.data)) {
        active = rData.data.slice(0, 3).some(item => (item.qpf > 0 || (item.precipChance || 0) >= 40));
      }
    }
    if (!active) { container.style.display = "none"; return; }
    if (pRes && pRes.ok) {
      const pData = await pRes.json();
      if (pData.success && pData.data) {
        const item = Array.isArray(pData.data) ? pData.data[0] : pData.data;
        if (item && item.insightTextLong) {
          text = Array.isArray(item.insightTextLong) ? item.insightTextLong[0] : item.insightTextLong;
        }
      }
    }
    const lower = text.toLowerCase();
    if (lower.includes("no rain") || lower.includes("dry") || lower.includes("clear")) {
      container.style.display = "none";
      return;
    }
    const txtEl = document.getElementById("rainOutlookText");
    if (txtEl && text) txtEl.innerText = text;
  } catch(y) {
    if (container) container.style.display = "none";
  }
}

async function loadRainChart(lat, lon) {
  const n = lat !== undefined ? lat : currentLat;
  const r = lon !== undefined ? lon : currentLon;
  const container = document.getElementById("rainChartSection");
  const chart = document.getElementById("rainChart");
  if (!container) return;
  try {
    const resp = await fetch(`${API_BASE}/api/hourly-rain?lat=${n}&lon=${r}`);
    if (!resp.ok) { container.style.display = "none"; return; }
    const json = await resp.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    if (!json.success || list.length === 0) { container.style.display = "none"; return; }
    const active = list.slice(0, 3).some(item => (Number(item?.precipChance || 0) >= 40 || Number(item?.qpf || 0) > 0));
    if (!active || !chart) { container.style.display = "none"; return; }
    chart.innerHTML = "";
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);

    list.forEach((item, idx) => {
      if (!item) return;
      const t = new Date(now.getTime() + 3600000 * idx);
      const timeLabel = t.toLocaleTimeString([], { hour: "numeric", hour12: true }).toLowerCase();
      const pop = Number(item.precipChance || 0);
      const col = document.createElement("div");
      col.className = "rain-bar-col";
      col.innerHTML = `
        <div class="bar-wrapper">
          <div class="bar" style="height: ${Math.max(Math.min(pop, 100), 10)}%;"></div>
        </div>
        <span class="time-label">${timeLabel}</span>
      `;
      chart.appendChild(col);
    });
    container.style.display = "block";
  } catch(u) {
    if (container) container.style.display = "none";
  }
}

function getWeatherIconPath(code, targetHour) {
  if (code === undefined || code === null) code = 44;

  const h = (targetHour !== undefined && targetHour !== null) ? Number(targetHour) : new Date().getHours();
  const isDaytime = (h >= 6 && h < 18);

  // Automatic day/night icon code adjustment for the specific target hour
  let adjustedCode = Number(code);
  if (isDaytime) {
    if (adjustedCode === 27) adjustedCode = 28;      // Mostly Cloudy Night -> Day
    else if (adjustedCode === 29) adjustedCode = 30; // Partly Cloudy Night -> Day
    else if (adjustedCode === 31) adjustedCode = 32; // Clear Night -> Sunny Day
    else if (adjustedCode === 33) adjustedCode = 34; // Fair Night -> Fair Day
    else if (adjustedCode === 45) adjustedCode = 39; // Showers Night -> Day
    else if (adjustedCode === 47) adjustedCode = 38; // Thunderstorms Night -> Day
  } else {
    if (adjustedCode === 28) adjustedCode = 27;      // Mostly Cloudy Day -> Night
    else if (adjustedCode === 30) adjustedCode = 29; // Partly Cloudy Day -> Night
    else if (adjustedCode === 32) adjustedCode = 31; // Sunny Day -> Clear Night
    else if (adjustedCode === 34) adjustedCode = 33; // Fair Day -> Fair Night
    else if (adjustedCode === 39) adjustedCode = 45; // Showers Day -> Night
    else if (adjustedCode === 38) adjustedCode = 47; // Thunderstorms Day -> Night
  }

  const icons = {
    0: "0 - Tornado.png", 1: "1 - Tropical Storm.png", 2: "2 - Hurricane.png", 3: "3 - Strong Storms.png",
    4: "4 - Thunderstorms.png", 5: "5 - Rain _ Snow.png", 6: "6 - Rain _ Sleet.png", 7: "7 - Wintry Mix.png",
    8: "8 - Freezing Drizzle.png", 9: "9 - Drizzle.png", 10: "10 - Freezing Rain.png", 11: "11 - Showers.png",
    12: "12 - Rain.png", 13: "13 - Flurries.png", 14: "14 - Snow Showers.png", 15: "15 - Blowing _ Drifting Snow.png",
    16: "16 - Snow.png", 17: "17 - Hail.png", 18: "18 - Sleet.png", 19: "19 - Blowing Dust _ Sandstorm.png",
    20: "20 - Foggy.png", 21: "21 - Haze.png", 22: "22 - Smoke.png", 23: "23 - Breezy.png", 24: "24 - Windy.png",
    25: "25 - Frigid _ Ice Crystals.png", 26: "26 - Cloudy.png", 27: "27 - Mostly Cloudy Night.png",
    28: "28 - Mostly Cloudy Day.png", 29: "29 - Partly Cloudy Night.png", 30: "30 - Partly Cloudy Day.png",
    31: "31 - Clear.png", 32: "32 - Sunny.png", 33: "33 - Fair _ Mostly Clear.png", 34: "34 - Fair _ Mostly Sunny.png",
    35: "35 - Mixed Rain and Hail.png", 36: "36 - Hot.png", 37: "37 - Isolated Thunderstorms.png",
    38: "38 - Scattered Thunderstorms Day.png", 39: "39 - Scattered Showers Day.png", 40: "40 - Heavy Rain.png",
    41: "41 - Scattered Snow Showers Day.png", 42: "42 - Heavy Snow.png", 43: "43 - Blizzard.png",
    44: "44 - Not Available (N_A).png", 45: "45 - Scattered Showers Night.png", 46: "46 - Scattered Snow Showers Night.png",
    47: "47 - Scattered Thunderstorms Night.png"
  };
  const filename = icons[adjustedCode] || icons[code] || "44 - Not Available (N_A).png";
  return `icons/${encodeURIComponent(filename)}`;
}

function preloadCommonWeatherIcons() {
  const commonCodes = [26, 27, 28, 29, 30, 31, 32, 33, 34, 11, 12, 4, 37, 38, 20, 21, 44];
  commonCodes.forEach(code => {
    const img = new Image();
    img.src = getWeatherIconPath(code);
  });
}

function updateWeatherLocation(lat, lon, name) {
  localStorage.setItem("savedLat", lat);
  localStorage.setItem("savedLon", lon);
  localStorage.setItem("savedLocationName", name);
  currentLat = lat;
  currentLon = lon;

  const idx = name.indexOf(",");
  let title = name;
  let sub = "";
  if (idx !== -1) {
    title = name.substring(0, idx).trim();
    sub = name.substring(idx + 1).trim();
  }
  const locTitle = document.getElementById("locationTitle");
  if (locTitle) locTitle.textContent = title;
  const locSub = document.getElementById("locationSub");
  const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  if (locSub) locSub.innerHTML = `${sub ? sub + " &bull; " : ""}As of <span id="updateTime">${timeStr}</span>`;

  loadCurrentWeather(lat, lon);
  loadHourlyForecast(lat, lon);
  loadDailyForecast(lat, lon);
  loadWeatherMetrics(lat, lon);
  loadRainChart(lat, lon);
  loadInsights(lat, lon);
  loadPrecipitationInsight(lat, lon);
}

function requestUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  const locBtn = document.getElementById("getLocationBtn");
  if (locBtn) {
    locBtn.style.opacity = "0.5";
    setTimeout(() => { if (locBtn) locBtn.style.opacity = "1"; }, 1500);
  }

  const handleSuccess = (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    currentLat = lat;
    currentLon = lon;
    updateWeatherLocation(lat, lon, "Current Location");
  };

  const handleError = (err) => {
    console.warn("Geolocation fallback:", err ? err.message : "error");
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      () => {},
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  };

  navigator.geolocation.getCurrentPosition(
    handleSuccess,
    handleError,
    { timeout: 8000, enableHighAccuracy: true, maximumAge: 60000 }
  );
}

// --- INITIAL LOAD & RESTORE CACHE IMMEDIATELY ---

function initInstantApp() {
  preloadCommonWeatherIcons();
  try {
    const cCurrent = localStorage.getItem('nwf_cache_current');
    if (cCurrent) renderCachedCurrent(JSON.parse(cCurrent));
    const cMetrics = localStorage.getItem('nwf_cache_metrics');
    if (cMetrics) renderCachedMetrics(JSON.parse(cMetrics));
    const cInsight = localStorage.getItem('nwf_cache_insight');
    if (cInsight) renderCachedInsight(cInsight);
    const cHourly = localStorage.getItem('nwf_cache_hourly');
    if (cHourly) renderCachedHourly(JSON.parse(cHourly));
    const cDaily = localStorage.getItem('nwf_cache_daily');
    if (cDaily) renderCachedDaily(JSON.parse(cDaily));
  } catch(e) {}

  const sLat = localStorage.getItem("savedLat");
  const sLon = localStorage.getItem("savedLon");
  const sName = localStorage.getItem("savedLocationName");

  if (sLat && sLon) {
    currentLat = sLat;
    currentLon = sLon;
    updateWeatherLocation(sLat, sLon, sName || "Saved Location");
  } else {
    updateWeatherLocation("27.7000", "83.4500", "Butwal, Nepal");
  }
}

document.addEventListener("DOMContentLoaded", initInstantApp);
window.addEventListener("DOMContentLoaded", initInstantApp);

// Search and UI handlers
const searchInput = document.getElementById("locationSearchInput");
const dropdown = document.getElementById("searchResultsDropdown");

function renderSearchDropdown(list) {
  if (!dropdown) return;
  dropdown.innerHTML = "";
  if (list && list.length > 0) {
    dropdown.style.display = "block";
    list.forEach((item) => {
      const div = document.createElement("div");
      div.className = "search-item";
      div.textContent = item.name;
      div.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        dropdown.style.display = "none";
        updateWeatherLocation(item.lat, item.lon, item.name);
      });
      dropdown.appendChild(div);
    });
  } else {
    dropdown.style.display = "none";
  }
}

let searchTimeout;

function resetToDefaultLocation() {
  localStorage.removeItem("savedLat");
  localStorage.removeItem("savedLon");
  localStorage.removeItem("savedLocationName");
  updateWeatherLocation("27.7000", "83.4500", "Butwal, Nepal");
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 2) {
      if (dropdown) { dropdown.innerHTML = ""; dropdown.style.display = "none"; }
      return;
    }

    // 1. INSTANT LOCAL OFFLINE SEARCH MATCHING
    const localMatches = NEPAL_PRESET_LOCATIONS.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    if (localMatches.length > 0) {
      renderSearchDropdown(localMatches.slice(0, 6));
    }

    // 2. ASYNC NETWORK GEOLOCATION SEARCH (Fallback/Additional)
    searchTimeout = setTimeout(async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/search-locations?q=${encodeURIComponent(query)}`);
        const json = await resp.json();
        const remoteList = (json && json.success && Array.isArray(json.data)) ? json.data : [];

        // Merge local and remote without duplicates
        const seen = new Set(localMatches.map(m => m.name.toLowerCase()));
        const combined = [...localMatches];

        remoteList.forEach(item => {
          if (item && item.name && !seen.has(item.name.toLowerCase())) {
            seen.add(item.name.toLowerCase());
            combined.push(item);
          }
        });

        if (combined.length > 0) {
          renderSearchDropdown(combined.slice(0, 6));
        } else {
          // ONLY show "No locations found" if BOTH local and remote returned zero results
          if (dropdown) {
            dropdown.innerHTML = '<div class="search-item">No locations found in Nepal</div>';
            dropdown.style.display = "block";
          }
        }
      } catch(r) {
        console.error("Search API error:", r);
        // On network error, keep showing localMatches if any exist
        if (localMatches.length > 0) {
          renderSearchDropdown(localMatches.slice(0, 6));
        } else if (dropdown) {
          dropdown.innerHTML = '<div class="search-item">No locations found in Nepal</div>';
          dropdown.style.display = "block";
        }
      }
    }, 300);
  });
}

const homeTitleEl = document.getElementById("homeTitle");
if (homeTitleEl) homeTitleEl.addEventListener("click", resetToDefaultLocation);
const homeLogoEl = document.getElementById("homeLogo");
if (homeLogoEl) homeLogoEl.addEventListener("click", resetToDefaultLocation);

// Automatically hide APK download prompts inside Android WebView
document.addEventListener("DOMContentLoaded", function() {
  const isApp = /NepalWeatherApp|wv|Android.*Version\/[0-9]\.[0-9]/i.test(navigator.userAgent) || window.isNativeApp === true;
  if (isApp) {
    const apkElements = document.querySelectorAll(".apk-showcase-section, .apk-top-banner");
    apkElements.forEach(function(el) { el.style.display = "none"; });
  }
});
