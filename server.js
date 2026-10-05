const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(__dirname));
app.use('/icons', express.static('icons'));

// --- DEFINE YOUR SEPARATE API KEYS HERE ---
const KEY_HOURLY_WEATHER = '71f92ea9dd2f4790b92ea9dd2f779061';
const KEY_DAILY_WEATHER   = '71f92ea9dd2f4790b92ea9dd2f779061';
const KEY_CURRENT_WEATHER = '71f92ea9dd2f4790b92ea9dd2f779061';
const KEY_INSIGHTS        = '71f92ea9dd2f4790b92ea9dd2f779061';
const KEY_METRICS         = '71f92ea9dd2f4790b92ea9dd2f779061';
const KEY_RAIN            = '71f92ea9dd2f4790b92ea9dd2f779061';

// Helper logic for daily forecast handler
const handleDailyWeather = async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    const url = `https://api.weather.com/v3/wx/forecast/daily/7day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_DAILY_WEATHER}`;
    const response = await axios.get(url);
    const raw = response.data;

    const dailyList = [];
    const length = raw?.dayOfWeek?.length || 0;

    for (let i = 0; i < length; i++) {
      const daypartIcons = raw.daypart?.[0]?.iconCode;
      const resolvedIconCode = daypartIcons?.[i * 2] ?? daypartIcons?.[(i * 2) + 1] ?? 44;

      const daypartPhrases = raw.daypart?.[0]?.wxPhraseLong;
      const resolvedCondition = daypartPhrases?.[i * 2] ?? daypartPhrases?.[(i * 2) + 1] ?? 'Cloudy';

      dailyList.push({
        day: raw.dayOfWeek?.[i] || 'N/A',
        tempMax: raw.calendarDayTemperatureMax?.[i] || raw.temperatureMax?.[i] || '--',
        tempMin: raw.calendarDayTemperatureMin?.[i] || raw.temperatureMin?.[i] || '--',
        condition: resolvedCondition,
        iconCode: resolvedIconCode,
        precipChance: raw.daypart?.[0]?.precipChance?.[i * 2] || 0
      });
    }

    res.json({ success: true, data: dailyList });
  } catch (error) {
    console.error('Daily API Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 1. Hourly Weather Route
app.get('/api/hourly-weather', async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    const url = `https://api.weather.com/v3/wx/forecast/hourly/2day?geocode=${lat},${lon}&units=m&language=en-US&cscCountryCode=NP&format=json&apiKey=${KEY_HOURLY_WEATHER}`;
    const response = await axios.get(url);
    const raw = response.data;

    const hourlyList = [];
    const length = raw?.validTimeLocal?.length || 0;
    
    for (let i = 0; i < Math.min(24, length); i++) {
      hourlyList.push({
        time: raw.validTimeLocal?.[i] || '',
        temperature: raw.temperature?.[i] || '--',
        condition: raw.wxPhraseLong?.[i] || 'N/A',
        humidity: raw.relativeHumidity?.[i] || 0,
        precipChance: raw.precipChance?.[i] || 0,
        iconCode: raw.iconCode?.[i] ?? 44
      });
    }

    res.json({ success: true, data: hourlyList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Daily Forecast Routes
app.get('/api/daily-weather', handleDailyWeather);
app.get('/api/daily-forecast', handleDailyWeather);

// 3. Current Weather Observations Route
app.get('/api/current-weather', async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    
    const weatherUrl = `https://api.weather.com/v3/wx/observations/current?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_CURRENT_WEATHER}`;
    
    const [weatherRes, geoRes] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`, {
        timeout: 4000,
        headers: { 'User-Agent': 'WeatherApp-Nepal' }
      }).catch(() => ({ data: {} }))
    ]);

    const raw = weatherRes.data;
    const address = geoRes.data.address || {};
    
    const cityName = address.city || address.town || address.village || address.suburb || address.county || "Current Location";
    const regionName = address.state || address.country || "";

    res.json({
      success: true,
      data: {
        cityName: cityName,
        region: regionName,
        temperature: raw.temperature ?? '--',
        feelsLike: raw.temperatureFeelsLike ?? '--',
        condition: raw.wxPhraseLong ?? 'N/A',
        humidity: raw.relativeHumidity ?? 0,
        precipChance: raw.precipChance ?? 0,
        uvIndex: raw.uvIndex ?? '--',
        time: raw.validTimeLocal ?? new Date().toISOString(),
        iconCode: raw.iconCode ?? 44
      }
    });
  } catch (error) {
    console.error('Current Weather API Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Insights Route
app.get('/api/insights', async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    const url = `https://api.weather.com/v3/insights?format=json&units=m&language=en-US&apiKey=${KEY_INSIGHTS}&insightType=trendingTemperatureInsight&par=twc&geocode=${lat},${lon}`;
    const response = await axios.get(url);
    const raw = response.data;

    const insightArray = Array.isArray(raw) ? raw : (raw?.insights || []);
    const insightItem = insightArray[0];

    const insightText = insightItem?.insightTextLong?.[0] || 
                        insightItem?.insightText?.[0] || 
                        'No current insights available.';

    res.json({
      success: true,
      insight: insightText
    });
  } catch (error) {
    console.error('Insights API Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Weather Metrics Route
app.get('/api/weather-metrics', async (req, res) => {
  try {
    const lat = req.query.lat || '27.714';
    const lon = req.query.lon || '85.311';

    const hourlyUrl = `https://api.weather.com/v3/wx/forecast/hourly/2day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_METRICS}`;
    const dailyUrl = `https://api.weather.com/v3/wx/forecast/daily/3day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_METRICS}`;
    const historicalUrl = `https://api.weather.com/v3/wx/conditions/historical/hourly/1day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_METRICS}`;
    const aqiUrl = `https://api.weather.com/v3/wx/globalAirQuality/forecast/hourly/12hour?geocode=${lat},${lon}&language=en-US&scale=EPA&format=json&apiKey=${KEY_METRICS}`;

    const [hourlyRes, dailyRes, historicalRes, aqiRes] = await Promise.all([
      axios.get(hourlyUrl).catch(() => ({ data: {} })),
      axios.get(dailyUrl).catch(() => ({ data: {} })),
      axios.get(historicalUrl).catch(() => ({ data: {} })),
      axios.get(aqiUrl).catch(() => ({ data: {} }))
    ]);

    const raw = hourlyRes.data || {};
    const daily = dailyRes.data || {};
    const historical = historicalRes.data || {};
    const aqiData = aqiRes.data || {};

    const parseFirst = (val) => {
      if (Array.isArray(val)) {
        const found = val.find(item => item !== null && item !== undefined && item !== '');
        return found ?? null;
      }
      return (val !== null && val !== undefined && val !== '') ? val : null;
    };

    const formatTimeStr = (isoString) => {
      if (!isoString) return null;
      try {
        const dateObj = new Date(isoString);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    const aqiArray = aqiData.globalairquality?.airQualityIndex || aqiData.airQualityIndex;
    const liveAQI = parseFirst(aqiArray) ?? '75';

    const rawMoonrise = parseFirst(daily.moonriseTimeLocal);
    const rawMoonset = parseFirst(daily.moonsetTimeLocal);
    const rawMoonPhase = parseFirst(daily.moonPhase) || parseFirst(daily.moonPhaseCode);

    const rawSunrise = parseFirst(historical.sunriseTimeLocal) || parseFirst(daily.sunriseTimeLocal);
    const rawSunset = parseFirst(historical.sunsetTimeLocal) || parseFirst(daily.sunsetTimeLocal);

    const currentTemp = parseFirst(raw.temperature) || 24;

    res.json({
      success: true,
      data: {
        temperature: currentTemp,
        tempMax: parseFirst(raw.temperatureMax24Hour) || (currentTemp + 3),
        tempMin: parseFirst(raw.temperatureMin24Hour) || (currentTemp - 4),
        feelsLike: parseFirst(raw.temperatureFeelsLike) || currentTemp,
        windSpeed: parseFirst(raw.windSpeed) || 0,
        windDirText: parseFirst(raw.windDirectionText) || 'N',
        humidity: parseFirst(raw.relativeHumidity) || 0,
        uvIndex: parseFirst(raw.uvIndex) || 0,
        uvDescription: parseFirst(raw.uvDescription) || 'Low',
        dewPoint: parseFirst(raw.temperatureDewPoint) || '--',
        pressure: parseFirst(raw.pressureMeanSeaLevel) || '--',
        visibility: parseFirst(raw.visibility) || '--',
        airQuality: liveAQI,
        sunrise: formatTimeStr(rawSunrise) || '6:05 AM',
        sunset: formatTimeStr(rawSunset) || '6:18 PM',
        moonrise: formatTimeStr(rawMoonrise) || '2:15 PM',
        moonset: formatTimeStr(rawMoonset) || '1:20 AM',
        moonPhase: rawMoonPhase || 'Waxing Gibbous'
      }
    });
  } catch (error) {
    console.error('Weather metrics error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Hourly Forecast Endpoint
app.get('/api/hourly-forecast', async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    const url = `https://api.weather.com/v3/wx/forecast/hourly/2day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_HOURLY_WEATHER}`;

    const response = await axios.get(url);
    const raw = response.data;

    const hourlyList = [];
    const length = raw?.validTimeLocal?.length || 0;
    
    for (let i = 0; i < Math.min(24, length); i++) {
      hourlyList.push({
        time: raw.validTimeLocal?.[i] || '',
        temperature: raw.temperature?.[i] || '--',
        condition: raw.wxPhraseLong?.[i] || 'N/A',
        humidity: raw.relativeHumidity?.[i] || 0,
        precipChance: raw.precipChance?.[i] || 0,
        iconCode: raw.iconCode?.[i] ?? 44
      });
    }

    res.json({ success: true, data: hourlyList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Hourly Rain Route
app.get('/api/hourly-rain', async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    const url = `https://api.weather.com/v3/wx/forecast/hourly/2day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_RAIN}`;
    const response = await axios.get(url);
    const raw = response.data;

    const rainList = [];
    let activeRainFound = false;
    const length = raw?.validTimeLocal?.length || 0;

    for (let i = 0; i < Math.min(12, length); i++) {
      const qpf = raw.qpf?.[i] || 0;
      const precipChance = raw.precipChance?.[i] || 0;

      if (qpf > 0 || precipChance > 20) {
        activeRainFound = true;
      }

      rainList.push({
        time: raw.validTimeLocal?.[i] || '',
        qpf: qpf,
        precipChance: precipChance
      });
    }

    res.json({ 
      success: true, 
      hasRain: activeRainFound, 
      data: rainList 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Nepal Location Search Route (Local Offline Database + Nominatim Fallback)

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

app.get('/api/search-locations', async (req, res) => {
  try {
    const query = (req.query.q || '').trim().toLowerCase();
    if (!query) return res.json({ success: true, data: [] });

    // 1. Instant match from local preset database
    const presetMatches = NEPAL_PRESET_LOCATIONS.filter(item =>
      item.name.toLowerCase().includes(query)
    );

    const locations = [...presetMatches];
    const seenNames = new Set(presetMatches.map(m => m.name.toLowerCase()));

    // 2. Try Nominatim as secondary source
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&accept-language=en&limit=10`;
      const response = await axios.get(nominatimUrl, {
        timeout: 4000,
        headers: {
          'User-Agent': 'NepalWeatherForecastApp-Production-v1.0 (support@nwfnp.netlify.app)'
        }
      });

      if (Array.isArray(response.data)) {
        for (const item of response.data) {
          const lowerName = item.display_name.toLowerCase();
          if (!seenNames.has(lowerName)) {
            seenNames.add(lowerName);
            locations.push({
              name: item.display_name,
              lat: item.lat,
              lon: item.lon
            });
          }
          if (locations.length >= 6) break;
        }
      }
    } catch (e) {
      console.warn("Nominatim search fallback:", e.message);
    }

    res.json({ success: true, data: locations.slice(0, 6) });
  } catch (error) {
    console.error("Search API Error:", error.message);
    // Always fallback to preset matches if any error
    const query = (req.query.q || '').trim().toLowerCase();
    const fallbackMatches = NEPAL_PRESET_LOCATIONS.filter(item =>
      item.name.toLowerCase().includes(query)
    );
    res.json({ success: true, data: fallbackMatches.slice(0, 6) });
  }
});

// 9. Precipitation Insight Endpoint
app.get('/api/precipitation-insight', async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    const apiKey = '71f92ea9dd2f4790b92ea9dd2f779061';
    
    const twcUrl = `https://api.weather.com/v3/insights?format=json&units=m&language=en-US&apiKey=${apiKey}&insightType=precipInsight&par=twc&geocode=${lat},${lon}`;
    
    const response = await fetch(twcUrl);
    
    if (!response.ok || response.status === 204) {
      return res.json({ success: true, data: [] });
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return res.json({ success: true, data: [] });
    }

    const data = JSON.parse(text);
    res.json({ success: true, data: data });
    
  } catch (error) {
    console.error('Error fetching precipitation insight:', error.message);
    res.json({ success: true, data: [] });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Proxy running on http://localhost:${PORT}`));
