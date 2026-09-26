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

// 2. Daily Forecast Routes (Supports both naming conventions)
app.get('/api/daily-weather', handleDailyWeather);
app.get('/api/daily-forecast', handleDailyWeather);

// 3. Current Weather Observations Route (Updated with Reverse Geocoding)
app.get('/api/current-weather', async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    
    const weatherUrl = `https://api.weather.com/v3/wx/observations/current?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_CURRENT_WEATHER}`;
    
    // Fetch weather data and reverse-geocode the location name at the same time
    const [weatherRes, geoRes] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`, {
        headers: { 'User-Agent': 'WeatherApp-Nepal' }
      }).catch(() => ({ data: {} })) // Fallback safely if geocoding fails
    ]);

    const raw = weatherRes.data;
    const address = geoRes.data.address || {};
    
    // Extract a clean city, town, or village name
    const cityName = address.city || address.town || address.village || address.suburb || address.county || "Current Location";
    const regionName = address.state || address.country || "";

    res.json({
      success: true,
      data: {
        cityName: cityName,         // <-- This is what your frontend needs for the title
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


// 4. Insights / Outlook Route
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

// 5. Weather Metrics Route (Aggregating 4 Weather.com endpoints)
app.get('/api/weather-metrics', async (req, res) => {
  try {
    const lat = req.query.lat || '27.714';
    const lon = req.query.lon || '85.311';

    // 1. Hourly Forecast (for general metrics: temp, humidity, wind, UV, etc.)
    const hourlyUrl = `https://api.weather.com/v3/wx/forecast/hourly/2day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_METRICS}`;
    
    // 2. Daily 3-Day Forecast (Used for Moonrise, Moonset, and Moon Phase)
    const dailyUrl = `https://api.weather.com/v3/wx/forecast/daily/3day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_METRICS}`;
    
    // 3. Historical 1-Day Conditions (Used for Sunrise and Sunset)
    const historicalUrl = `https://api.weather.com/v3/wx/conditions/historical/hourly/1day?geocode=${lat},${lon}&units=m&language=en-US&format=json&apiKey=${KEY_METRICS}`;
    
    // 4. Global Air Quality 12-Hour Forecast (Used for Air Quality Index)
    const aqiUrl = `https://api.weather.com/v3/wx/globalAirQuality/forecast/hourly/12hour?geocode=${lat},${lon}&language=en-US&scale=EPA&format=json&apiKey=${KEY_METRICS}`;

    // Execute requests in parallel
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

    // Helper to find the first valid non-empty item from response arrays
    const parseFirst = (val) => {
      if (Array.isArray(val)) {
        const found = val.find(item => item !== null && item !== undefined && item !== '');
        return found ?? null;
      }
      return (val !== null && val !== undefined && val !== '') ? val : null;
    };

    // Helper to format ISO timestamps (e.g., "2026-09-21T06:05:00+0545") to "6:05 AM"
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

    // --- METRIC EXTRACTION --- //

    // 1. Air Quality (from 12-hour globalAirQuality array)
    const aqiArray = aqiData.globalairquality?.airQualityIndex || aqiData.airQualityIndex;
    const liveAQI = parseFirst(aqiArray) ?? '75';

    // 2. Moon Metrics (from Daily 3-Day Forecast)
    const rawMoonrise = parseFirst(daily.moonriseTimeLocal);
    const rawMoonset = parseFirst(daily.moonsetTimeLocal);
    const rawMoonPhase = parseFirst(daily.moonPhase) || parseFirst(daily.moonPhaseCode);

    // 3. Sunrise & Sunset (from Historical 1-Day Conditions, with Daily fallback)
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
        
        // Output extracted fields
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Proxy running on http://localhost:${PORT}`));


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

// 8. Nepal Location Search Route (OpenStreetMap Nominatim)

app.get('/api/search-locations', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json({ success: true, data: [] });

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&accept-language=en&limit=10`;
    
    // 👇 Change the User-Agent to a completely unique app string
    const response = await axios.get(nominatimUrl, {
      headers: { 
        'User-Agent': 'NepalWeatherForecastApp-Production-v1.0 (support@nwfnp.netlify.app)' 
      }
    });

    const seenNames = new Set();
    const locations = [];

    for (const item of response.data) {
      if (!seenNames.has(item.display_name)) {
        seenNames.add(item.display_name);
        locations.push({
          name: item.display_name,
          lat: item.lat,
          lon: item.lon
        });
      }
      if (locations.length >= 5) break;
    }

    res.json({ success: true, data: locations });
  } catch (error) {
    console.error("Search API Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Add this to your backend server file (e.g., server.js)

app.get('/api/precipitation-insight', async (req, res) => {
  try {
    const lat = req.query.lat || '27.701';
    const lon = req.query.lon || '83.464';
    const apiKey = '71f92ea9dd2f4790b92ea9dd2f779061';
    
    const twcUrl = `https://api.weather.com/v3/insights?format=json&units=m&language=en-US&apiKey=${apiKey}&insightType=precipInsight&par=twc&geocode=${lat},${lon}`;
    
    const response = await fetch(twcUrl);
    
    // If the API isn't ok or returns 204 No Content, return a safe empty payload instead of crashing
    if (!response.ok || response.status === 204) {
      return res.json({ success: true, data: [] });
    }

    // Check if the response body is actually text/content before parsing
    const text = await response.text();
    if (!text || text.trim() === '') {
      return res.json({ success: true, data: [] });
    }

    const data = JSON.parse(text);
    res.json({ success: true, data: data });
    
  } catch (error) {
    console.error('Error fetching precipitation insight:', error.message);
    // Return safe fallback instead of 500 error to keep frontend clean
    res.json({ success: true, data: [] });
  }
});

