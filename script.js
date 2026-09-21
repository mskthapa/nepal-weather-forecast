// Global active coordinates (defaults to Butwal)
let currentLat = '27.7000';
let currentLon = '83.4500';


// async function loadHourlyForecast() {
//   try {
//     const response = await fetch(`http://localhost:5000/api/hourly-forecast?lat=${currentLat}&lon=${currentLon}`);
//     const result = await response.json();
    
//     console.log("Hourly API Result:", result);

//     if (result.success && result.data) {
//       let hourlyArray = Array.isArray(result.data) ? result.data : (result.data.hourly || Object.values(result.data)[0]);

//       if (Array.isArray(hourlyArray) && hourlyArray.length > 0) {
//         const container = document.getElementById('hourlyForecast');
//         if (!container) return;
//         container.innerHTML = ''; // Clear loading message
        
//         // 1. Grab the exact live current temperature directly from the API's first hourly item (fallback to top header if needed)
//         const liveTemp = hourlyArray[0].temperature !== undefined ? hourlyArray[0].temperature : (hourlyArray[0].temp !== undefined ? hourlyArray[0].temp : null);
//         const currentTempText = liveTemp !== null ? `${liveTemp}°C` : '33°C';

//         // === ICON CODE UNTOUCHED AS REQUESTED ===
//         const mainIconEl = document.querySelector('#topWeatherIcon') || document.querySelector('.current-card img') || document.querySelector('.top-right-icon');
//         const currentIconSrc = mainIconEl ? mainIconEl.src : getWeatherIconPath(hourlyArray[0]?.iconCode || hourlyArray[0]?.wxIcon);
//         // =======================================
        
//         // 2. Create the manual "Now" card
//         const nowCard = document.createElement('div');
//         nowCard.className = 'hourly-card';
//         nowCard.innerHTML = `
//           <p class="time"><strong>Now</strong></p>
//           <img src="${currentIconSrc}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
//           <p class="temp">${currentTempText}</p>
//         `;
//         container.appendChild(nowCard);
        
//         // 3. Anchor to the exact next upcoming full hour
//         const baseTime = new Date();
//         baseTime.setMinutes(0, 0, 0); 
//         baseTime.setHours(baseTime.getHours() + 1); 

//         // 4. Loop through the array starting from index 1
//         hourlyArray.forEach((hour, index) => {
//           if (index === 0) return; 

//           const tempValue = hour.temperature !== undefined ? hour.temperature : (hour.temp !== undefined ? hour.temp : '--');
//           const iconCode = hour.iconCode || hour.wxIcon;

//           const cardTime = new Date(baseTime.getTime() + ((index - 1) * 60 * 60 * 1000));
//           const timeFormatted = cardTime.toLocaleTimeString([], { hour: 'numeric', hour12: true });

//           const iconUrl = getWeatherIconPath(iconCode);
          
//           const card = document.createElement('div');
//           card.className = 'hourly-card';
//           card.innerHTML = `
//             <p class="time"><strong>${timeFormatted}</strong></p>
//             <img src="${iconUrl}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
//             <p class="temp">${tempValue}°C</p>
//           `;
//           container.appendChild(card);
//         });
//       } else {
//         console.error("Could not resolve hourly data array:", result.data);
//       }
//     }
//   } catch (error) {
//     console.error('Failed to load hourly forecast:', error);
//   }
// }

async function loadHourlyForecast(lat, lon) {
  try {
    const targetLat = lat !== undefined ? lat : currentLat;
    const targetLon = lon !== undefined ? lon : currentLon;

    const response = await fetch(`http://localhost:5000/api/hourly-forecast?lat=${targetLat}&lon=${targetLon}`);
    const result = await response.json();
    
    console.log("Hourly API Result:", result);

    if (result.success && result.data) {
      let hourlyArray = Array.isArray(result.data) ? result.data : (result.data.hourly || Object.values(result.data)[0]);

      if (Array.isArray(hourlyArray) && hourlyArray.length > 0) {
        const container = document.getElementById('hourlyForecast');
        if (!container) return;
        container.innerHTML = ''; // Clear loading message
        
        const liveTemp = hourlyArray[0].temperature !== undefined ? hourlyArray[0].temperature : (hourlyArray[0].temp !== undefined ? hourlyArray[0].temp : null);
        const currentTempText = liveTemp !== null ? `${liveTemp}°C` : '33°C';

        const mainIconEl = document.querySelector('#topWeatherIcon') || document.querySelector('.current-card img') || document.querySelector('.top-right-icon');
        const currentIconSrc = mainIconEl ? mainIconEl.src : getWeatherIconPath(hourlyArray[0]?.iconCode || hourlyArray[0]?.wxIcon);
        
        const nowCard = document.createElement('div');
        nowCard.className = 'hourly-card';
        nowCard.innerHTML = `
          <p class="time"><strong>Now</strong></p>
          <img src="${currentIconSrc}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
          <p class="temp">${currentTempText}</p>
        `;
        container.appendChild(nowCard);
        
        const baseTime = new Date();
        baseTime.setMinutes(0, 0, 0); 
        baseTime.setHours(baseTime.getHours() + 1); 

        hourlyArray.forEach((hour, index) => {
          if (index === 0) return; 

          const tempValue = hour.temperature !== undefined ? hour.temperature : (hour.temp !== undefined ? hour.temp : '--');
          const iconCode = hour.iconCode || hour.wxIcon;

          const cardTime = new Date(baseTime.getTime() + ((index - 1) * 60 * 60 * 1000));
          const timeFormatted = cardTime.toLocaleTimeString([], { hour: 'numeric', hour12: true });

          const iconUrl = getWeatherIconPath(iconCode);
          
          const card = document.createElement('div');
          card.className = 'hourly-card';
          card.innerHTML = `
            <p class="time"><strong>${timeFormatted}</strong></p>
            <img src="${iconUrl}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
            <p class="temp">${tempValue}°C</p>
          `;
          container.appendChild(card);
        });
      } else {
        console.error("Could not resolve hourly data array:", result.data);
      }
    }
  } catch (error) {
    console.error('Failed to load hourly forecast:', error);
  }
}


// 2. Fetch and render 7-day daily forecast
async function loadDailyForecast() {
  try {
    const response = await fetch(`http://localhost:5000/api/daily-forecast?lat=${currentLat}&lon=${currentLon}`);
    const result = await response.json();
    
    if (result.success) {
      const container = document.getElementById('dailyForecast');
      if (!container) return;
      container.innerHTML = ''; // Clear loading message
      
      result.data.forEach(day => {
        const dailyIconUrl = getWeatherIconPath(day.iconCode);

        const card = document.createElement('div');
        card.className = 'daily-card';
        card.innerHTML = `
          <p class="day-name"><strong>${day.day}</strong></p>
          <img src="${dailyIconUrl}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
          <p class="temps">High: ${day.tempMax}°C | Low: ${day.tempMin}°C</p>
          <p>${day.condition}</p>
        `;
        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error('Failed to load daily forecast:', error);
  }
}

// 3. Fetch and render current weather
// async function loadCurrentWeather() {
//   try {
//     const response = await fetch(`http://localhost:5000/api/current-weather?lat=${currentLat}&lon=${currentLon}`);
//     const result = await response.json();
    
//     if (result.success) {
//       const data = result.data;
      
//       const setElText = (id, val) => {
//         const el = document.getElementById(id);
//         if (el) el.textContent = val;
//       };

//       setElText('currentTemp', data.temperature);
//       setElText('currentCondition', data.condition);
//       setElText('feelsLike', data.feelsLike);
//       setElText('precipitation', data.precipChance);
//       setElText('humidity', data.humidity);
//       setElText('uvIndex', data.uvIndex);
      
//       const iconImgEl = document.getElementById('currentWeatherIcon');
//       if (iconImgEl) {
//         iconImgEl.src = getWeatherIconPath(data.iconCode);
//       }
      
//       const now = new Date();
//       const formattedTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
//       const updateTimeEl = document.getElementById('updateTime');
//       if (updateTimeEl) {
//         updateTimeEl.textContent = `As of ${formattedTime}`;
//       }
//     }
//   } catch (error) {
//     console.error('Failed to load current weather:', error);
//   }
// }

// 3. Fetch and render current weather
async function loadCurrentWeather(lat, lon) {
  try {
    const targetLat = lat !== undefined ? lat : currentLat;
    const targetLon = lon !== undefined ? lon : currentLon;

    const response = await fetch(`http://localhost:5000/api/current-weather?lat=${targetLat}&lon=${targetLon}`);
    if (!response.ok) return;

    const result = await response.json();
    
    if (result.success && result.data) {
      const data = result.data;
      
      const setElText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      // Update place name header
      const locationName = data.cityName || data.location || data.address || data.placeName;
      if (locationName) {
        const titleEl = document.getElementById('locationTitle');
        if (titleEl) titleEl.textContent = locationName;
      }

      const regionName = data.region || data.state || data.country || "";
      const subEl = document.getElementById('locationSub');
      const timeString = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      if (subEl) {
        const fullSubtext = regionName ? `${regionName} &bull; As of ` : `As of `;
        subEl.innerHTML = `${fullSubtext}<span id="updateTime">${timeString}</span>`;
      }

      setElText('currentTemp', data.temperature);
      setElText('currentCondition', data.condition);
      setElText('feelsLike', data.feelsLike);
      setElText('precipitation', data.precipChance);
      setElText('humidity', data.humidity);
      setElText('uvIndex', data.uvIndex);
      
      const iconImgEl = document.getElementById('currentWeatherIcon');
      if (iconImgEl) {
        iconImgEl.src = getWeatherIconPath(data.iconCode);
      }
    }
  } catch (error) {
    console.error('Failed to load current weather:', error);
  }
}

async function loadPrecipitationInsight(lat, lon) {
  try {
    const targetLat = lat !== undefined ? lat : currentLat;
    const targetLon = lon !== undefined ? lon : currentLon;

    const response = await fetch(`http://localhost:5000/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`);
    if (!response.ok) return;

    const result = await response.json();
    
    // Target your exact HTML section ID here
    const precipSection = document.getElementById('rainChartSection') || document.querySelector('.precipitation-section');

    let longText = "";
    if (result.success && result.data) {
      const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
      if (insightObj?.insightTextLong) {
        longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
      }
    }

    const precipChanceEl = document.getElementById('precipitation');
    const precipChanceValue = precipChanceEl ? precipChanceEl.textContent : "";
    const isZeroRain = precipChanceValue.includes("0%") || precipChanceValue === "0";

    const hasRain = longText && 
                    longText.trim().length > 0 && 
                    !longText.toLowerCase().includes("no rain") && 
                    !isZeroRain;

    if (precipSection) {
      if (!hasRain) {
        precipSection.style.display = 'none'; // Hides when dry
      } else {
        precipSection.style.display = 'block'; // Shows when raining
        const outlookEl = document.getElementById('rainOutlookText');
        const insightEl = document.getElementById('precipInsightText');
        if (outlookEl) outlookEl.innerText = longText;
        if (insightEl) insightEl.innerText = longText;
      }
    }
  } catch (error) {
    console.error('Failed to load precipitation insight:', error);
  }
}

// 4. Fetch and render weather insights
async function loadInsights() {
  try {
    const response = await fetch(`http://localhost:5000/api/insights?lat=${currentLat}&lon=${currentLon}`);
    const result = await response.json();

    if (result.success) {
      const container = document.getElementById('weatherInsight');
      if (container) container.innerHTML = `<p>${result.insight}</p>`;
    }
  } catch (error) {
    console.error('Failed to load insights:', error);
  }
}

// Helper for mapping icon codes to files
function getWeatherIconPath(iconCode) {
  const iconMap = {
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

  const fileName = iconMap[iconCode] || "44 - Not Available (N_A).png";
  return `http://localhost:5000/icons/${fileName}`;
}

// 5. Fetch and render extended metrics
// async function loadWeatherMetrics() {
//   try {
//     const response = await fetch(`http://localhost:5000/api/weather-metrics?lat=${currentLat}&lon=${currentLon}`);
//     const result = await response.json();
    
//     if (result.success) {
//       const d = result.data;
//       const setText = (id, text) => {
//         const el = document.getElementById(id);
//         if (el) el.textContent = text;
//       };

//       setText('metricTemp', `${d.temperature}°`);
//       setText('metricMaxMin', `${d.tempMax}°`);
//       setText('metricFeelsLike', `${d.feelsLike}°`);
//       setText('metricWindSpeed', d.windSpeed);
//       setText('metricWindDir', d.windDirText);
//       setText('metricHumidity', `${d.humidity}%`);
//       setText('metricUvIndex', d.uvIndex);
//       setText('metricUvDesc', d.uvDescription);
//       setText('metricAirQuality', d.airQuality);
//       setText('metricDewPoint', `${d.dewPoint}°`);
//       setText('metricPressure', `${d.pressure} mb`);
//       setText('metricVisibility', `${d.visibility} km`);
//       setText('metricSunrise', d.sunrise);
//       setText('metricSunset', d.sunset);
//       setText('metricMoonrise', d.moonrise);
//       setText('metricMoonset', d.moonset);
//       setText('metricMoonPhase', d.moonPhase);
//     }
//   } catch (error) {
//     console.error('Failed to load weather metrics:', error);
//   }
// }

async function loadWeatherMetrics(lat, lon) {
  try {
    const targetLat = lat !== undefined ? lat : currentLat;
    const targetLon = lon !== undefined ? lon : currentLon;

    const response = await fetch(`http://localhost:5000/api/weather-metrics?lat=${targetLat}&lon=${targetLon}`);
    const result = await response.json();
    
    if (result.success) {
      const d = result.data;
      const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      };

      setText('metricTemp', `${d.temperature}°`);
      setText('metricMaxMin', `${d.tempMax}°`);
      setText('metricFeelsLike', `${d.feelsLike}°`);
      setText('metricWindSpeed', d.windSpeed);
      setText('metricWindDir', d.windDirText);
      setText('metricHumidity', `${d.humidity}%`);
      setText('metricUvIndex', d.uvIndex);
      setText('metricUvDesc', d.uvDescription);
      setText('metricAirQuality', d.airQuality);
      setText('metricDewPoint', `${d.dewPoint}°`);
      setText('metricPressure', `${d.pressure} mb`);
      setText('metricVisibility', `${d.visibility} km`);
      setText('metricSunrise', d.sunrise);
      setText('metricSunset', d.sunset);
      setText('metricMoonrise', d.moonrise);
      setText('metricMoonset', d.moonset);
      setText('metricMoonPhase', d.moonPhase);
    }
  } catch (error) {
    console.error('Failed to load weather metrics:', error);
  }
}

// 6. Fetch and render rain chart
async function loadRainChart() {
  try {
    const response = await fetch(`http://localhost:5000/api/hourly-rain?lat=${currentLat}&lon=${currentLon}`);
    const result = await response.json();

    const sectionEl = document.getElementById('rainChartSection');
    
    if (!result.success || !result.hasRain) {
      if (sectionEl) sectionEl.style.display = 'none';
      return;
    }

    if (sectionEl) sectionEl.style.display = 'block';

    const container = document.getElementById('rainChart');
    if (!container) return;
    container.innerHTML = '';

    const baseTime = new Date();
    baseTime.setMinutes(0, 0, 0); 
    baseTime.setHours(baseTime.getHours() + 1);

    result.data.forEach((item, index) => {
      const barTime = new Date(baseTime.getTime() + (index * 60 * 60 * 1000));
      const timeFormatted = barTime.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toLowerCase();
      
      // Directly use the true precipChance percentage (0-100), fallback to 10% minimum height
      const rawChance = item.precipChance !== undefined ? item.precipChance : (item.pop !== undefined ? item.pop : 0);
      const heightPercentage = Math.max(Math.min(rawChance, 100), 10);

      const col = document.createElement('div');
      col.className = 'rain-bar-col';
      col.innerHTML = `
        <div class="bar-wrapper">
          <div class="bar" style="height: ${heightPercentage}%;"></div>
        </div>
        <span class="time-label">${timeFormatted}</span>
      `;
      container.appendChild(col);
    });
  } catch (error) {
    console.error('Failed to load rain chart:', error);
  }
}

// Master function to refresh everything when a location is picked
function updateWeatherLocation(lat, lon, locationName) {
  currentLat = lat;
  currentLon = lon;
  
  // 1. Split the location string at the first comma
  const commaIndex = locationName.indexOf(',');
  let primaryName = locationName;
  let remainingLocation = '';

  if (commaIndex !== -1) {
    primaryName = locationName.substring(0, commaIndex).trim();       // "Kathmandu Metropolitan City"
    remainingLocation = locationName.substring(commaIndex + 1).trim(); // "Kathmandu, Bagamati Province, Nepal"
  }

  // 2. Update the main title element
  const titleEl = document.getElementById('locationTitle');
  if (titleEl) {
    titleEl.textContent = primaryName;
  }
  
  // 3. Update the subtitle element with the remaining text and current timestamp
  const subEl = document.getElementById('locationSub');
  const timeString = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (subEl) {
    subEl.innerHTML = `${remainingLocation} &bull; As of <span id="updateTime">${timeString}</span>`;
  }
  
  // 4. Load all weather components for the new coordinates
  loadCurrentWeather();
  loadHourlyForecast();
  loadDailyForecast();
  loadWeatherMetrics();
  loadRainChart();
  loadInsights();
  loadPrecipitationInsight();
}

// Initial page load listener
window.addEventListener('DOMContentLoaded', () => {
  loadCurrentWeather();
  loadHourlyForecast();
  loadDailyForecast();
  loadWeatherMetrics();
  loadRainChart();
  loadInsights();
  loadPrecipitationInsight();
});

// Search autocomplete logic
const searchInput = document.getElementById('locationSearchInput');
const dropdown = document.getElementById('searchResultsDropdown');

let searchTimeout;

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      if (dropdown) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
      }
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/search-locations?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          dropdown.innerHTML = '';
          dropdown.style.display = 'block';

          result.data.forEach(loc => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.textContent = loc.name;
            
            div.addEventListener('click', () => {
              searchInput.value = loc.name;
              dropdown.style.display = 'none';
              updateWeatherLocation(loc.lat, loc.lon, loc.name);
            });

            dropdown.appendChild(div);
          });
        } else {
          dropdown.innerHTML = '<div class="search-item">No locations found in Nepal</div>';
          dropdown.style.display = 'block';
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 300);
  });
}

function generateRainOutlook(hourlyDataList) {
  // Check if thunderstorms are present in the conditions
  const hasThunder = hourlyDataList.some(hour => 
    hour.wxPhraseLong && hour.wxPhraseLong.toLowerCase().includes('thunder')
  );
  
  // Check if heavy rain is present
  const hasHeavyRain = hourlyDataList.some(hour => hour.qpf > 4.0); // Adjust threshold as needed

  if (hasThunder) {
    return "Outlook: Occasional thunderstorms likely to continue for the next several hours.";
  } else if (hasHeavyRain) {
    return "Outlook: Rain likely for the next several hours. Locally heavy rainfall possible.";
  } else {
    return "Outlook: Light precipitation expected over the next few hours.";
  }
}

// Call this when your hourly/rain data loads and set it to your outlook text element:
// const outlookElement = document.getElementById('rainOutlookText');
// if (outlookElement) {
//   outlookElement.textContent = generateRainOutlook(result.data.hourly);
// }
//HERE I REMOVED THIS //

// Example: This is your main weather loading or search handler function
async function loadWeatherData(lat, lon, fullLocationString) {
  try {
    // 1. Fetch your weather data...
    const response = await fetch(`http://localhost:5000/api/weather?lat=${lat}&lon=${lon}`);
    const data = await response.json();

    // ==========================================================
    // 2. PASTE THE LOCATION SPLITTING CODE RIGHT HERE:
    // ==========================================================
    const commaIndex = fullLocationString.indexOf(',');
    let primaryName = fullLocationString;
    let remainingLocation = '';

    if (commaIndex !== -1) {
      primaryName = fullLocationString.substring(0, commaIndex).trim();       // e.g., "Kathmandu Metropolitan City"
      remainingLocation = fullLocationString.substring(commaIndex + 1).trim(); // e.g., "Kathmandu, Bagamati Province, Nepal"
    }

    // Get current time string (e.g., "3:21 PM" or your dynamic time variable)
    const timeString = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    // Update your specific HTML elements instantly:
    document.getElementById('locationTitle').innerText = primaryName;
    document.getElementById('locationSub').innerHTML = `${remainingLocation} &bull; As of <span id="updateTime">${timeString}</span>`;
    // ==========================================================

    // ... rest of your code for temperature, icons, and hourly forecasts ...

  } catch (error) {
    console.error('Failed to load weather:', error);
  }
}


// async function loadPrecipitationInsight(lat, lon) {
//   try {
//     // Use passed parameters or fall back to global application coordinates
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     const response = await fetch(`http://localhost:5000/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`);
//     if (!response.ok) return;

//     const result = await response.json();

//     // Target your precipitation container/section in the HTML
//     // (Replace '.precipitation-section' with the actual class name or ID of your container box)
//     const precipSection = document.querySelector('.precipitation-section') || document.querySelector('.outlook-section');

//     let longText = "";
//     if (result.success && result.data) {
//       const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
      
//       if (insightObj?.insightTextLong) {
//         longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
//       }
//     }

//     // Check if there is valid rain narrative text
//     const hasRain = longText && longText.trim().length > 0 && !longText.toLowerCase().includes("no rain");

//     if (precipSection) {
//       if (!hasRain) {
//         // Hide the precipitation card/section completely if there is no rain
//         precipSection.style.display = 'none';
//       } else {
//         // Show the section and populate text elements if rain is present
//         precipSection.style.display = 'block';
        
//         const outlookEl = document.getElementById('rainOutlookText');
//         const insightEl = document.getElementById('precipInsightText');
        
//         if (outlookEl) outlookEl.innerText = longText;
//         if (insightEl) insightEl.innerText = longText;
//       }
//     }
//   } catch (error) {
//     console.error('Failed to load precipitation insight:', error);
//   }
// }

// async function loadPrecipitationInsight(lat, lon) {
//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     // 1. Fetch BOTH the insight text and the hourly rain data
//     const [insightRes, rainRes] = await Promise.all([
//       fetch(`http://localhost:5000/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`),
//       fetch(`http://localhost:5000/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`)
//     ]);

//     const precipSection = document.getElementById('rainChartSection') || document.querySelector('.precipitation-section');
//     if (!precipSection) return;

//     let hasActiveRain = false;
//     let longText = "";

//     // 2. Check hourly rain data (the actual bars on your chart)
//     if (rainRes.ok) {
//       const rainJson = await rainRes.json();
//       if (rainJson.success && Array.isArray(rainJson.data)) {
//         // Check if any hour in the forecast has rain (QPF > 0 or Chance > 15%)
//         hasActiveRain = rainJson.data.some(hour => (hour.qpf > 0 || hour.precipChance > 15));
//       }
//     }

//     // 3. Check insight text as a backup
//     if (insightRes.ok) {
//       const result = await insightRes.json();
//       if (result.success && result.data) {
//         const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
//         if (insightObj?.insightTextLong) {
//           longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
//         }
//       }
//     }

//     const textLower = longText.toLowerCase();
//     const isDryText = textLower.includes("no rain") || 
//                       textLower.includes("no precipitation") || 
//                       textLower.includes("dry") || 
//                       textLower.includes("clear");

//     // If text explicitly says dry, override rain status
//     if (isDryText) {
//       hasActiveRain = false;
//     }

//     // 4. Final Show / Hide Toggle
//     if (!hasActiveRain) {
//       // HIDE completely when dry (Leaving Today's Outlook safe)
//       precipSection.style.display = 'none';
//     } else {
//       // SHOW when raining
//       precipSection.style.display = 'block';
      
//       const outlookEl = document.getElementById('rainOutlookText');
//       if (outlookEl && longText) {
//         outlookEl.innerText = longText;
//       }
//     }
//   } catch (error) {
//     console.error('Failed to load precipitation insight:', error);
//   }
// }

// async function loadPrecipitationInsight(lat, lon) {
//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     // 1. Fetch BOTH the insight text and the hourly rain data
//     const [insightRes, rainRes] = await Promise.all([
//       fetch(`http://localhost:5000/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`),
//       fetch(`http://localhost:5000/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`)
//     ]);

//     const precipSection = document.getElementById('rainChartSection') || document.querySelector('.precipitation-section');
//     if (!precipSection) return;

//     let hasActiveRain = false;
//     let longText = "";

//     // 2. Check hourly rain data (the actual bars on your chart)
//     if (rainRes.ok) {
//       const rainJson = await rainRes.json();
//       if (rainJson.success && Array.isArray(rainJson.data)) {
//         // Check if any hour in the forecast has rain (QPF > 0 or Chance > 15%)
//         hasActiveRain = rainJson.data.some(hour => (hour.qpf > 0 || hour.precipChance > 15));
//       }
//     }

//     // 3. Check insight text as a backup
//     if (insightRes.ok) {
//       const result = await insightRes.json();
//       if (result.success && result.data) {
//         const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
//         if (insightObj?.insightTextLong) {
//           longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
//         }
//       }
//     }

//     const textLower = longText.toLowerCase();
//     const isDryText = textLower.includes("no rain") || 
//                       textLower.includes("no precipitation") || 
//                       textLower.includes("dry") || 
//                       textLower.includes("clear");

//     // If text explicitly says dry, override rain status
//     if (isDryText) {
//       hasActiveRain = false;
//     }

//     // 4. Final Show / Hide Toggle
//     if (!hasActiveRain) {
//       // HIDE completely when dry (Leaving Today's Outlook safe)
//       precipSection.style.display = 'none';
//     } else {
//       // SHOW when raining
//       precipSection.style.display = 'block';
      
//       const outlookEl = document.getElementById('rainOutlookText');
//       if (outlookEl && longText) {
//         outlookEl.innerText = longText;
//       }
//     }
//   } catch (error) {
//     console.error('Failed to load precipitation insight:', error);
//   }
// }

// async function loadPrecipitationInsight(lat, lon) {
//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     // 1. Fetch BOTH the insight text and the hourly rain data
//     const [insightRes, rainRes] = await Promise.all([
//       fetch(`http://localhost:5000/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`),
//       fetch(`http://localhost:5000/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`)
//     ]);

//     const precipSection = document.getElementById('rainChartSection') || document.querySelector('.precipitation-section');
//     if (!precipSection) return;

//     let hasActiveRain = false;
//     let longText = "";

//     // 2. Check hourly rain data (the actual bars on your chart)
//     if (rainRes.ok) {
//       const rainJson = await rainRes.json();
//       if (rainJson.success && Array.isArray(rainJson.data)) {
//         // Check if any hour in the forecast has rain (QPF > 0 or Chance > 15%)
//         hasActiveRain = rainJson.data.some(hour => (hour.qpf > 0 || hour.precipChance > 15));
//       }
//     }

//     // 3. Check insight text as a backup
//     if (insightRes.ok) {
//       const result = await insightRes.json();
//       if (result.success && result.data) {
//         const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
//         if (insightObj?.insightTextLong) {
//           longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
//         }
//       }
//     }

//     const textLower = longText.toLowerCase();
//     const isDryText = textLower.includes("no rain") || 
//                       textLower.includes("no precipitation") || 
//                       textLower.includes("dry") || 
//                       textLower.includes("clear");

//     // If text explicitly says dry, override rain status
//     if (isDryText) {
//       hasActiveRain = false;
//     }

//     // 4. Final Show / Hide Toggle
//     if (!hasActiveRain) {
//       // HIDE completely when dry (Leaving Today's Outlook safe)
//       precipSection.style.display = 'none';
//     } else {
//       // SHOW when raining
//       precipSection.style.display = 'block';
      
//       const outlookEl = document.getElementById('rainOutlookText');
//       if (outlookEl && longText) {
//         outlookEl.innerText = longText;
//       }
//     }
//   } catch (error) {
//     console.error('Failed to load precipitation insight:', error);
//   }
// }

// async function loadPrecipitationInsight(lat, lon) {
//   try {
//     const targetLat = lat !== undefined ? lat : (typeof currentLat !== 'undefined' ? currentLat : 27.7000);
//     const targetLon = lon !== undefined ? lon : (typeof currentLon !== 'undefined' ? currentLon : 83.4500);

//     // 1. Fetch BOTH the insight text and the hourly rain data using API_BASE
//     const [insightRes, rainRes] = await Promise.all([
//       fetch(`${API_BASE}/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`),
//       fetch(`${API_BASE}/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`)
//     ]);

//     const precipSection = document.getElementById('rainChartSection') || document.querySelector('.precipitation-section');
//     if (!precipSection) return;

//     let hasActiveRain = false;
//     let longText = "";

//     // 2. Check hourly rain data (the actual bars on your chart)
//     if (rainRes.ok) {
//       const rainJson = await rainRes.json();
//       if (rainJson.success && Array.isArray(rainJson.data)) {
//         // Check if any hour in the forecast has rain (QPF > 0 or Chance > 15%)
//         hasActiveRain = rainJson.data.some(hour => (hour.qpf > 0 || hour.precipChance > 15));
//       }
//     }

//     // 3. Check insight text as a backup
//     if (insightRes.ok) {
//       const result = await insightRes.json();
//       if (result.success && result.data) {
//         const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
//         if (insightObj?.insightTextLong) {
//           longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
//         }
//       }
//     }

//     const textLower = longText.toLowerCase();
//     const isDryText = textLower.includes("no rain") || 
//                       textLower.includes("no precipitation") || 
//                       textLower.includes("dry") || 
//                       textLower.includes("clear");

//     // If text explicitly says dry, override rain status
//     if (isDryText) {
//       hasActiveRain = false;
//     }

//     // 4. Final Show / Hide Toggle (Hides completely when dry, shows only when raining)
//     if (!hasActiveRain) {
//       precipSection.style.display = 'none';
//     } else {
//       precipSection.style.display = 'block';
      
//       const outlookEl = document.getElementById('rainOutlookText');
//       if (outlookEl && longText) {
//         outlookEl.innerText = longText;
//       }
//     }
//   } catch (error) {
//     console.error('Failed to load precipitation insight:', error);
//   }
// }

async function loadPrecipitationInsight(lat, lon) {
  const precipSection = document.getElementById('rainChartSection') || document.querySelector('.precipitation-section');
  if (!precipSection) return;

  // 0. INSTANTLY hide it while loading new location data so old rain doesn't linger
  precipSection.style.display = 'none';

  try {
    const targetLat = lat !== undefined ? lat : (typeof currentLat !== 'undefined' ? currentLat : 27.7000);
    const targetLon = lon !== undefined ? lon : (typeof currentLon !== 'undefined' ? currentLon : 83.4500);

    // 1. Fetch BOTH the insight text and the hourly rain data using API_BASE
    const [insightRes, rainRes] = await Promise.all([
      fetch(`${API_BASE}/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`),
      fetch(`${API_BASE}/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`)
    ]);

    let hasActiveRain = false;
    let longText = "";

    // 2. Check hourly rain data (the actual bars on your chart)
    if (rainRes.ok) {
      const rainJson = await rainRes.json();
      if (rainJson.success && Array.isArray(rainJson.data)) {
        // Check if any hour in the forecast has rain (QPF > 0 or Chance > 15%)
        hasActiveRain = rainJson.data.some(hour => (hour.qpf > 0 || hour.precipChance > 15));
      }
    }

    // 3. Check insight text as a backup
    if (insightRes.ok) {
      const result = await insightRes.json();
      if (result.success && result.data) {
        const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
        if (insightObj?.insightTextLong) {
          longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
        }
      }
    }

    const textLower = longText.toLowerCase();
    const isDryText = textLower.includes("no rain") || 
                      textLower.includes("no precipitation") || 
                      textLower.includes("dry") || 
                      textLower.includes("clear");

    // If text explicitly says dry, override rain status
    if (isDryText) {
      hasActiveRain = false;
    }

    // 4. Final Show / Hide Toggle (Reveals only if active rain is confirmed)
    if (!hasActiveRain) {
      precipSection.style.display = 'none';
    } else {
      precipSection.style.display = 'block';
      
      const outlookEl = document.getElementById('rainOutlookText');
      if (outlookEl && longText) {
        outlookEl.innerText = longText;
      }
    }
  } catch (error) {
    console.error('Failed to load precipitation insight:', error);
    precipSection.style.display = 'none';
  }
}

function requestUserLocation() {
  console.log("📍 requestUserLocation function triggered!");

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      console.log(`📍 Coordinates retrieved: Lat ${lat}, Lon ${lon}`);
      
      // Update your global variables
      currentLat = lat;
      currentLon = lon;
      
      // Call your actual existing data loading functions with the new coordinates
      if (typeof loadCurrentWeather === 'function') loadCurrentWeather(lat, lon);
      if (typeof loadHourlyForecast === 'function') loadHourlyForecast(lat, lon);
      if (typeof loadWeatherMetrics === 'function') loadWeatherMetrics(lat, lon); // <-- ADDED THIS!
      if (typeof loadPrecipitationInsight === 'function') loadPrecipitationInsight(lat, lon);
      
      // If you have a general fetcher function, call it here too:
      if (typeof fetchWeatherData === 'function') fetchWeatherData(lat, lon);

    },
    (error) => {
      console.warn("⚠️ Geolocation error:", error.message);
      switch(error.code) {
        case error.PERMISSION_DENIED:
          alert("Location permission denied. Please allow location access in your browser settings.");
          break;
        case error.POSITION_UNAVAILABLE:
          alert("Location information is unavailable.");
          break;
        case error.TIMEOUT:
          alert("The request to fetch your location timed out.");
          break;
        default:
          alert("An unknown error occurred.");
          break;
      }
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}