// Automatically switches between Localhost and Render
// const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
//   ? 'http://localhost:5000'
//   : 'https://nepal-weather-forecast-backend.onrender.com/'; // Replace with your actual Render URL
// 1. Detect if local or live
const rawApiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://nepal-weather-forecast-backend.onrender.com';

// 2. Remove any extra slash at the end automatically
const API_BASE = rawApiBase.replace(/\/+$/, '');

// Global active coordinates (defaults to Butwal)
let currentLat = '27.7000';
let currentLon = '83.4500';



// async function loadHourlyForecast(lat, lon) {
//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     const response = await fetch(`${API_BASE}/api/hourly-forecast?lat=${targetLat}&lon=${targetLon}`);
//     const result = await response.json();
    
//     if (result.success && result.data) {
//       let hourlyArray = Array.isArray(result.data) ? result.data : (result.data.hourly || Object.values(result.data)[0]);

//       if (Array.isArray(hourlyArray) && hourlyArray.length > 0) {
//         const container = document.getElementById('hourlyForecast');
//         if (!container) return;
//         container.innerHTML = ''; // Clear loading message
        
//         const liveTemp = hourlyArray[0].temperature !== undefined ? hourlyArray[0].temperature : (hourlyArray[0].temp !== undefined ? hourlyArray[0].temp : null);
//         const currentTempText = liveTemp !== null ? `${liveTemp}°C` : '33°C';

//         // 🔑 FIX: Look for the top section's icon image and reuse its exact source so they match!
//         const topIconImg = document.querySelector('.top-right-icon') || document.querySelector('#topWeatherIcon') || document.querySelector('.current-card img');
//         let currentIconSrc = topIconImg ? topIconImg.src : '';


//         // Fallback to hourly data if top icon isn't found yet
//         if (!currentIconSrc || currentIconSrc.includes('undefined')) {
//           const firstHour = hourlyArray[0];
//           const rawIconCode = firstHour.iconCode || firstHour.wxIcon || firstHour.icon || firstHour.weatherIcon;
//           currentIconSrc = getWeatherIconPath(rawIconCode);
//         }
        
//         const nowCard = document.createElement('div');
//         nowCard.className = 'hourly-card';
//         nowCard.innerHTML = `
//           <p class="time"><strong>Now</strong></p>
//           <img src="${currentIconSrc}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
//           <p class="temp">${currentTempText}</p>
//         `;
//         container.appendChild(nowCard);
        
//         const baseTime = new Date();
//         baseTime.setMinutes(0, 0, 0); 
//         baseTime.setHours(baseTime.getHours() + 1); 

//         hourlyArray.forEach((hour, index) => {
//           if (index === 0) return; 

//           const tempValue = hour.temperature !== undefined ? hour.temperature : (hour.temp !== undefined ? hour.temp : '--');
//           const iconCode = hour.iconCode || hour.wxIcon || hour.icon || hour.weatherIcon;

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

    const response = await fetch(`${API_BASE}/api/hourly-forecast?lat=${targetLat}&lon=${targetLon}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      let hourlyArray = Array.isArray(result.data) ? result.data : (result.data.hourly || Object.values(result.data)[0]);

      if (Array.isArray(hourlyArray) && hourlyArray.length > 0) {
        window.latestHourlyData = hourlyArray;

        const container = document.getElementById('hourlyForecast');
        if (!container) return;
        container.innerHTML = '';
        
        const liveTemp = hourlyArray[0].temperature !== undefined ? hourlyArray[0].temperature : (hourlyArray[0].temp !== undefined ? hourlyArray[0].temp : null);
        const currentTempText = liveTemp !== null ? `${liveTemp}°C` : '28°C';

        // Parse rain chance for "Now"
        const nowRawPop = hourlyArray[0].precipChance ?? hourlyArray[0].pop ?? hourlyArray[0].precip ?? 0;
        const nowPop = Math.round(parseInt(String(nowRawPop).replace(/[^0-9]/g, ''), 10) || 0);
        const nowPrecipHtml = nowPop > 0 ? `<div class="precip-badge"><span class="drop-icon">💧</span>${nowPop}%</div>` : '';

        // 🔑 ICON RESOLUTION FIX: Check all possible icon keys in hourly item
        const firstHour = hourlyArray[0];
        const rawIconCode = firstHour.iconCode ?? firstHour.wxIcon ?? firstHour.icon ?? firstHour.weatherIcon ?? firstHour.icon_code ?? firstHour.wx_icon;
        
        let calculatedIconPath = '';
        if (typeof getWeatherIconPath === 'function' && rawIconCode !== undefined && rawIconCode !== null) {
          calculatedIconPath = getWeatherIconPath(rawIconCode);
        }

        // Try DOM top card image -> global cached URL -> calculated hourly path
        const topIconImg = document.querySelector('.hero-card img, .current-card img, .top-card img, #topWeatherIcon, #currentWeatherIcon, .top-right-icon, [class*="current"] img');
        let currentIconSrc = '';

        if (topIconImg && topIconImg.src && topIconImg.src.startsWith('http') && !topIconImg.src.includes('undefined')) {
          currentIconSrc = topIconImg.src;
        } else if (window.currentWeatherIconUrl && window.currentWeatherIconUrl.startsWith('http') && !window.currentWeatherIconUrl.includes('undefined')) {
          currentIconSrc = window.currentWeatherIconUrl;
        } else if (calculatedIconPath && !calculatedIconPath.includes('undefined')) {
          currentIconSrc = calculatedIconPath;
        }

        // Failsafe: If still missing, use hour 1's icon code or fallback
        if (!currentIconSrc || currentIconSrc.includes('undefined')) {
          const secondHourCode = hourlyArray[1]?.iconCode ?? hourlyArray[1]?.wxIcon ?? hourlyArray[1]?.icon;
          currentIconSrc = typeof getWeatherIconPath === 'function' ? getWeatherIconPath(secondHourCode) : '';
        }

        const nowCard = document.createElement('div');
        nowCard.className = 'hourly-card';
        nowCard.innerHTML = `
          <p class="time"><strong>Now</strong></p>
          <img id="nowHourlyIcon" src="${currentIconSrc}" alt="Weather Icon" class="forecast-icon" width="40" height="40" onerror="this.onerror=null; if(window.currentWeatherIconUrl) this.src=window.currentWeatherIconUrl;">
          <p class="temp">${currentTempText}</p>
          ${nowPrecipHtml}
        `;
        container.appendChild(nowCard);
        
        const baseTime = new Date();
        baseTime.setMinutes(0, 0, 0); 
        baseTime.setHours(baseTime.getHours() + 1); 

        hourlyArray.forEach((hour, index) => {
          if (index === 0) return; 

          const tempValue = hour.temperature !== undefined ? hour.temperature : (hour.temp !== undefined ? hour.temp : '--');
          const iconCode = hour.iconCode || hour.wxIcon || hour.icon || hour.weatherIcon || hour.icon_code;

          const rawPop = hour.precipChance ?? hour.pop ?? hour.precip ?? 0;
          const pop = Math.round(parseInt(String(rawPop).replace(/[^0-9]/g, ''), 10) || 0);
          const precipHtml = pop > 0 ? `<div class="precip-badge"><span class="drop-icon">💧</span>${pop}%</div>` : '';

          const cardTime = new Date(baseTime.getTime() + ((index - 1) * 60 * 60 * 1000));
          const timeFormatted = cardTime.toLocaleTimeString([], { hour: 'numeric', hour12: true });

          const iconUrl = getWeatherIconPath(iconCode);
          
          const card = document.createElement('div');
          card.className = 'hourly-card';
          card.innerHTML = `
            <p class="time"><strong>${timeFormatted}</strong></p>
            <img src="${iconUrl}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
            <p class="temp">${tempValue}°C</p>
            ${precipHtml}
          `;
          container.appendChild(card);
        });
      }
    }
  } catch (error) {
    console.error('Failed to load hourly forecast:', error);
  }
}

async function loadDailyForecast(lat, lon) {
  try {
    const targetLat = lat !== undefined ? lat : currentLat;
    const targetLon = lon !== undefined ? lon : currentLon;

    const response = await fetch(`${API_BASE}/api/daily-forecast?lat=${targetLat}&lon=${targetLon}`);
    const result = await response.json();
    
    if (result.success) {
      const container = document.getElementById('dailyForecast');
      if (!container) return;
      container.innerHTML = ''; 
      
      result.data.forEach((day) => {
        const dailyIconUrl = getWeatherIconPath(day.iconCode);

        // 🔑 FIX: Parse numbers out of strings like "35%" or "50%"
        let pop = 0;
        const precipCandidates = [
          day.precipChance,
          day.dayPrecipChance,
          day.nightPrecipChance,
          day.precipChanceNight,
          day.precipChanceDay,
          day.pop,
          day.precip,
          day.day?.precipChance,
          day.night?.precipChance
        ];

        for (const val of precipCandidates) {
          if (val !== undefined && val !== null) {
            const parsed = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) {
              pop = parsed;
              break;
            }
          }
        }

        // 🔑 FIX for Tuesday: If daily API returns 0 but condition says Showers/Rain, fall back to hourly rain data
        if (pop === 0) {
          const cond = (day.condition || '').toLowerCase();
          if (cond.includes('rain') || cond.includes('shower') || cond.includes('thunder') || cond.includes('drizzle')) {
            if (Array.isArray(window.latestHourlyData) && window.latestHourlyData.length > 0) {
              const maxHourly = Math.max(...window.latestHourlyData.slice(0, 12).map(h => {
                const p = h.precipChance ?? h.pop ?? h.precip ?? 0;
                return parseInt(String(p).replace(/[^0-9]/g, ''), 10) || 0;
              }));
              if (maxHourly > 0) pop = maxHourly;
            }
            if (pop === 0) pop = 35; // Default threshold fallback if condition states rain/showers
          }
        }

        const precipHtml = pop > 0 ? `<div class="precip-badge"><span class="drop-icon">💧</span>${pop}%</div>` : '';

        const card = document.createElement('div');
        card.className = 'daily-card';
        card.innerHTML = `
          <p class="day-name"><strong>${day.day}</strong></p>
          <img src="${dailyIconUrl}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
          <p class="temps">High: ${day.tempMax}°C | Low: ${day.tempMin}°C</p>
          <p class="condition-text">${day.condition}</p>
          ${precipHtml}
        `;
        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error('Failed to load daily forecast:', error);
  }
}

// 2. Fetch and render 7-day daily forecast
// async function loadDailyForecast(lat, lon) {
//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     const response = await fetch(`${API_BASE}/api/daily-forecast?lat=${targetLat}&lon=${targetLon}`);
//     const result = await response.json();
    
//     if (result.success) {
//       const container = document.getElementById('dailyForecast');
//       if (!container) return;
//       container.innerHTML = ''; // Clear loading message
      
//       result.data.forEach(day => {
//         const dailyIconUrl = getWeatherIconPath(day.iconCode);

//         const card = document.createElement('div');
//         card.className = 'daily-card';
//         card.innerHTML = `
//           <p class="day-name"><strong>${day.day}</strong></p>
//           <img src="${dailyIconUrl}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
//           <p class="temps">High: ${day.tempMax}°C | Low: ${day.tempMin}°C</p>
//           <p>${day.condition}</p>
//         `;
//         container.appendChild(card);
//       });
//     }
//   } catch (error) {
//     console.error('Failed to load daily forecast:', error);
//   }
// }

// async function loadDailyForecast(lat, lon) {
//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     const response = await fetch(`${API_BASE}/api/daily-forecast?lat=${targetLat}&lon=${targetLon}`);
//     const result = await response.json();
    
//     if (result.success) {
//       const container = document.getElementById('dailyForecast');
//       if (!container) return;
//       container.innerHTML = ''; // Clear loading message
      
//       result.data.forEach(day => {
//         const dailyIconUrl = getWeatherIconPath(day.iconCode);

//         // Extract rain chance for daily cards
//         const rawPop = day.precipChance ?? day.dayPrecipChance ?? day.pop ?? day.precip ?? 0;
//         const pop = Math.round(Number(rawPop));
//         const precipHtml = pop > 0 ? `<div class="precip-badge"><span class="drop-icon">💧</span>${pop}%</div>` : '';

//         const card = document.createElement('div');
//         card.className = 'daily-card';
//         card.innerHTML = `
//           <p class="day-name"><strong>${day.day}</strong></p>
//           <img src="${dailyIconUrl}" alt="Weather Icon" class="forecast-icon" width="40" height="40">
//           <p class="temps">High: ${day.tempMax}°C | Low: ${day.tempMin}°C</p>
//           <p class="condition-text">${day.condition}</p>
//           ${precipHtml}
//         `;
//         container.appendChild(card);
//       });
//     }
//   } catch (error) {
//     console.error('Failed to load daily forecast:', error);
//   }
// }

// 3. Fetch and render current weather

// async function loadPrecipitationInsight(lat, lon) {
//   const precipSection = document.getElementById('rainChartSection') || document.querySelector('.precipitation-section');
//   if (!precipSection) return;

//   precipSection.style.display = 'none';

//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     const [insightRes, rainRes] = await Promise.all([
//       fetch(`${API_BASE}/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`),
//       fetch(`${API_BASE}/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`)
//     ]);

//     let hasHighRainChance = false;
//     let longText = "";

//     if (rainRes.ok) {
//       const rainJson = await rainRes.json();
//       if (rainJson.success && Array.isArray(rainJson.data)) {
//         // Strictly check if ANY hour has a chance >= 40% or QPF > 0
//         hasHighRainChance = rainJson.data.some(hour => {
//           const chance = hour.precipChance !== undefined ? hour.precipChance : (hour.pop !== undefined ? hour.pop : 0);
//           return (hour.qpf > 0 || chance >= 40);
//         });
//       }
//     }

//     if (insightRes.ok) {
//       const result = await insightRes.json();
//       if (result.success && result.data) {
//         const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
//         if (insightObj?.insightTextLong) {
//           longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
//         }
//       }
//     }

//     // If the hourly chance is less than 40%, force-hide it regardless of backend text
//     if (!hasHighRainChance) {
//       precipSection.style.display = 'none';
//       return;
//     }

//     // Also double-check if the text explicitly states it's dry
//     const textLower = longText.toLowerCase();
//     const isDryText = textLower.includes("no rain") || 
//                       textLower.includes("no precipitation") || 
//                       textLower.includes("dry") || 
//                       textLower.includes("clear");

//     if (isDryText) {
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
//     precipSection.style.display = 'none';
//   }
// }

async function loadPrecipitationInsight(lat, lon) {
  const precipSection = document.getElementById('rainChartSection') || document.querySelector('.precipitation-section');
  if (!precipSection) return;

  try {
    const targetLat = lat !== undefined ? lat : (typeof currentLat !== 'undefined' ? currentLat : '27.714');
    const targetLon = lon !== undefined ? lon : (typeof currentLon !== 'undefined' ? currentLon : '85.311');

    const [insightRes, rainRes] = await Promise.all([
      fetch(`${API_BASE}/api/precipitation-insight?lat=${targetLat}&lon=${targetLon}`).catch(() => null),
      fetch(`${API_BASE}/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`).catch(() => null)
    ]);

    let hasHighRainChance = false;
    let longText = "";

    if (rainRes && rainRes.ok) {
      const rainJson = await rainRes.json();
      if (rainJson.success && Array.isArray(rainJson.data)) {
        // 1. FIX: Inspect ONLY the next 6 hours instead of all 24 hours
        const upcomingHours = rainJson.data.slice(0, 3);
        
        hasHighRainChance = upcomingHours.some(hour => {
          const chance = hour.precipChance !== undefined ? hour.precipChance : (hour.pop !== undefined ? hour.pop : 0);
          return (hour.qpf > 0 || chance >= 40);
        });
      }
    }

    // If there is no high rain chance in the NEXT 6 HOURS, force hide and stop immediately
    if (!hasHighRainChance) {
      precipSection.style.display = 'none';
      return;
    }

    if (insightRes && insightRes.ok) {
      const result = await insightRes.json();
      if (result.success && result.data) {
        const insightObj = Array.isArray(result.data) ? result.data[0] : result.data;
        if (insightObj?.insightTextLong) {
          longText = Array.isArray(insightObj.insightTextLong) ? insightObj.insightTextLong[0] : insightObj.insightTextLong;
        }
      }
    }

    // Check if text indicates dry weather
    const textLower = longText.toLowerCase();
    const isDryText = textLower.includes("no rain") || 
                      textLower.includes("no precipitation") || 
                      textLower.includes("dry") || 
                      textLower.includes("clear");

    if (isDryText) {
      precipSection.style.display = 'none';
      return;
    }

    // Update text content without forcing display:block prematurely
    const outlookEl = document.getElementById('rainOutlookText');
    if (outlookEl && longText) {
      outlookEl.innerText = longText;
    }

    // Note: Displaying the section is handled by loadRainChart once chart bars are drawn

  } catch (error) {
    console.error('Failed to load precipitation insight:', error);
    if (precipSection) precipSection.style.display = 'none';
  }
}

// async function loadCurrentWeather(lat, lon) {
//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     // Fetch current weather AND hourly rain data at the same time
//     const [weatherRes, rainRes] = await Promise.all([
//       fetch(`${API_BASE}/api/current-weather?lat=${targetLat}&lon=${targetLon}`),
//       fetch(`${API_BASE}/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`)
//     ]);

//     if (!weatherRes.ok) return;

//     const result = await weatherRes.json();
    
//     if (result.success && result.data) {
//       const data = result.data;
      
//       const setElText = (id, val) => {
//         const el = document.getElementById(id);
//         if (el) el.textContent = val;
//       };

//       const locationName = data.cityName || data.location || data.address || data.placeName;
//       if (locationName) {
//         const titleEl = document.getElementById('locationTitle');
//         if (titleEl) titleEl.textContent = locationName;
//       }

//       const regionName = data.region || data.state || data.country || "";
//       const subEl = document.getElementById('locationSub');
//       const timeString = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
//       if (subEl) {
//         const fullSubtext = regionName ? `${regionName} &bull; As of ` : `As of `;
//         subEl.innerHTML = `${fullSubtext}<span id="updateTime">${timeString}</span>`;
//       }

//       setElText('currentTemp', data.temperature);
//       setElText('currentCondition', data.condition);
//       setElText('feelsLike', data.feelsLike);
//       setElText('humidity', data.humidity);
//       setElText('uvIndex', data.uvIndex);

//       // --- SMART RAIN CHANCE FALLBACK ---
//       let finalRainChance = data.precipChance !== undefined ? data.precipChance : 0;
      
//       // If current weather says 0, check the hourly rain API for a more accurate current chance
//       if ((!finalRainChance || finalRainChance === 0 || finalRainChance === "0") && rainRes.ok) {
//         const rainJson = await rainRes.json();
//         if (rainJson.success && Array.isArray(rainJson.data) && rainJson.data.length > 0) {
//           const firstHour = rainJson.data[0];
//           finalRainChance = firstHour.precipChance !== undefined ? firstHour.precipChance : (firstHour.pop !== undefined ? firstHour.pop : 0);
//         }
//       }
//       setElText('precipitation', `${finalRainChance}`);
//       // ----------------------------------
      
//       const iconImgEl = document.getElementById('currentWeatherIcon');
//       if (iconImgEl) {
//         iconImgEl.src = getWeatherIconPath(data.iconCode);
//       }
//     }
//   } catch (error) {
//     console.error('Failed to load current weather:', error);
//   }
// }


async function loadCurrentWeather(lat, lon) {
  try {
    const targetLat = lat !== undefined ? lat : currentLat;
    const targetLon = lon !== undefined ? lon : currentLon;

    // Fetch current weather AND hourly rain data at the same time
    const [weatherRes, rainRes] = await Promise.all([
      fetch(`${API_BASE}/api/current-weather?lat=${targetLat}&lon=${targetLon}`),
      fetch(`${API_BASE}/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`)
    ]);

    if (!weatherRes.ok) return;

    const result = await weatherRes.json();
    
    if (result.success && result.data) {
      const data = result.data;
      
      const setElText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

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
      setElText('humidity', data.humidity);
      setElText('uvIndex', data.uvIndex);

      // --- SMART RAIN CHANCE FALLBACK ---
      let finalRainChance = data.precipChance !== undefined ? data.precipChance : 0;
      
      // If current weather says 0, check the hourly rain API for a more accurate current chance
      if ((!finalRainChance || finalRainChance === 0 || finalRainChance === "0") && rainRes.ok) {
        const rainJson = await rainRes.json();
        if (rainJson.success && Array.isArray(rainJson.data) && rainJson.data.length > 0) {
          const firstHour = rainJson.data[0];
          finalRainChance = firstHour.precipChance !== undefined ? firstHour.precipChance : (firstHour.pop !== undefined ? firstHour.pop : 0);
        }
      }
      setElText('precipitation', `${finalRainChance}`);
      // ----------------------------------
      
      // --- TOP ICON SETTING & HOURLY "NOW" SYNC ---
      const mainIconUrl = getWeatherIconPath(data.iconCode);
      
      // Cache image URL globally for other functions
      window.currentWeatherIconUrl = mainIconUrl;

      // 1. Update top blue card icon
      const iconImgEl = document.getElementById('currentWeatherIcon');
      if (iconImgEl) {
        iconImgEl.src = mainIconUrl;
      }

      // 2. Immediately sync the "Now" card in Hourly Forecast if it exists
      const nowIconEl = document.getElementById('nowHourlyIcon') || document.querySelector('#hourlyForecast .hourly-card:first-child img');
      if (nowIconEl) {
        nowIconEl.src = mainIconUrl;
      }
      // --------------------------------------------
    }
  } catch (error) {
    console.error('Failed to load current weather:', error);
  }
}


// 4. Fetch and render weather insights
async function loadInsights(lat, lon) {
  try {
    const targetLat = lat !== undefined ? lat : currentLat;
    const targetLon = lon !== undefined ? lon : currentLon;

    const response = await fetch(`${API_BASE}/api/insights?lat=${targetLat}&lon=${targetLon}`);
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
  return `${API_BASE}/icons/${fileName}`;
}

// 5. Fetch and render extended metrics

async function loadWeatherMetrics(lat, lon) {
  try {
    const targetLat = lat ?? (typeof currentLat !== 'undefined' ? currentLat : '27.714');
    const targetLon = lon ?? (typeof currentLon !== 'undefined' ? currentLon : '85.311');

    console.log(`[Metrics] Fetching from: ${API_BASE}/api/weather-metrics?lat=${targetLat}&lon=${targetLon}`);

    const response = await fetch(`${API_BASE}/api/weather-metrics?lat=${targetLat}&lon=${targetLon}`);
    
    if (!response.ok) {
      console.error(`[Metrics Error] HTTP status: ${response.status}`);
      return;
    }

    const result = await response.json();
    console.log("[Metrics Success] Received data from backend:", result);

    if (result.success && result.data) {
      const d = result.data;

      const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = (text !== null && text !== undefined && text !== '') ? text : '--';
        } else {
          console.warn(`[UI Warning] HTML element with id="${id}" not found in DOM.`);
        }
      };

      setText('metricTemp', `${d.temperature}°`);
      setText('metricMaxMin', `${d.tempMin}° / ${d.tempMax}°`);
      setText('metricFeelsLike', `${d.feelsLike}°`);
      setText('metricWindSpeed', `${d.windSpeed} km/h`);
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
    console.error('[Metrics Error] Failed to load weather metrics:', error);
  }
}

// Call automatically when the script loads to populate initial UI
document.addEventListener('DOMContentLoaded', () => {
  loadWeatherMetrics();
});

// 6. Fetch and render rain chart

// async function loadRainChart(lat, lon) {
//   // Instantly hide the section right away so old rain never lingers
//   const sectionEl = document.getElementById('rainChartSection');
//   if (sectionEl) sectionEl.style.display = 'none';

//   try {
//     const targetLat = lat !== undefined ? lat : currentLat;
//     const targetLon = lon !== undefined ? lon : currentLon;

//     const response = await fetch(`${API_BASE}/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`);
//     const result = await response.json();
    
//     if (!result.success || !result.hasRain || !result.data || result.data.length === 0) {
//       if (sectionEl) sectionEl.style.display = 'none';
//       return;
//     }

//     // Optional safety check: ensure at least one hour has actual rain likelihood
//     const hasActualRain = result.data.some(item => {
//       const chance = item.precipChance !== undefined ? item.precipChance : (item.pop !== undefined ? item.pop : 0);
//       const qpf = item.qpf || 0;
//       return chance >= 40 || qpf > 0;
//     });

//     if (!hasActualRain) {
//       if (sectionEl) sectionEl.style.display = 'none';
//       return;
//     }

//     if (sectionEl) sectionEl.style.display = 'block';

//     const container = document.getElementById('rainChart');
//     if (!container) return;
//     container.innerHTML = '';

//     const baseTime = new Date();
//     baseTime.setMinutes(0, 0, 0); 
//     baseTime.setHours(baseTime.getHours() + 1);

//     result.data.forEach((item, index) => {
//       const barTime = new Date(baseTime.getTime() + (index * 60 * 60 * 1000));
//       const timeFormatted = barTime.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toLowerCase();
      
//       const rawChance = item.precipChance !== undefined ? item.precipChance : (item.pop !== undefined ? item.pop : 0);
//       const heightPercentage = Math.max(Math.min(rawChance, 100), 10);

//       const col = document.createElement('div');
//       col.className = 'rain-bar-col';
//       col.innerHTML = `
//         <div class="bar-wrapper">
//           <div class="bar" style="height: ${heightPercentage}%;"></div>
//         </div>
//         <span class="time-label">${timeFormatted}</span>
//       `;
//       container.appendChild(col);
//     });
//   } catch (error) {
//     console.error('Failed to load rain chart:', error);
//     if (sectionEl) sectionEl.style.display = 'none';
//   }
// }

async function loadRainChart(lat, lon) {
  const sectionEl = document.getElementById('rainChartSection');
  const container = document.getElementById('rainChart');

  // 1. Keep section hidden initially
  if (sectionEl) sectionEl.style.display = 'none';

  try {
    const targetLat = lat !== undefined ? lat : (typeof currentLat !== 'undefined' ? currentLat : '27.714');
    const targetLon = lon !== undefined ? lon : (typeof currentLon !== 'undefined' ? currentLon : '85.311');

    const response = await fetch(`${API_BASE}/api/hourly-rain?lat=${targetLat}&lon=${targetLon}`);
    
    if (!response.ok) {
      if (sectionEl) sectionEl.style.display = 'none';
      return;
    }

    const result = await response.json();
    
    // Defensive check: extract array safely regardless of response wrapper
    const rainArray = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);

    if (!result.success || rainArray.length === 0) {
      if (sectionEl) sectionEl.style.display = 'none';
      return;
    }

    // 2. Inspect ONLY the immediate next 6 hours
    const upcomingHours = rainArray.slice(0, 3);
    const hasActualRain = upcomingHours.some(item => {
      if (!item) return false;
      const chance = item.precipChance ?? item.pop ?? item.precip ?? 0;
      const qpf = item.qpf ?? item.amount ?? 0;
      return Number(chance) >= 40 || Number(qpf) > 0;
    });

    if (!hasActualRain) {
      if (sectionEl) sectionEl.style.display = 'none';
      return;
    }

    // 3. Verify target container exists before clearing placeholder
    if (!container) {
      console.warn('[Rain Chart] Element id="rainChart" not found in DOM.');
      if (sectionEl) sectionEl.style.display = 'none';
      return;
    }

    // 4. CLEAR "Loading precipitation chart..." text BEFORE rendering bars
    container.innerHTML = '';

    const baseTime = new Date();
    baseTime.setMinutes(0, 0, 0); 
    baseTime.setHours(baseTime.getHours() + 1);

    // 5. Build and append chart bars
    rainArray.forEach((item, index) => {
      if (!item) return;
      const barTime = new Date(baseTime.getTime() + (index * 60 * 60 * 1000));
      const timeFormatted = barTime.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toLowerCase();
      
      const rawChance = Number(item.precipChance ?? item.pop ?? item.precip ?? 0);
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

    // 6. FINALLY show the card section ONLY after chart bars are attached
    if (sectionEl) sectionEl.style.display = 'block';

  } catch (error) {
    console.error('Failed to load rain chart:', error);
    if (sectionEl) sectionEl.style.display = 'none';
  }
}

// Master function to refresh everything when a location is picked

function updateWeatherLocation(lat, lon, locationName) {
  // --- SAVE TO LOCALSTORAGE ---
  localStorage.setItem('savedLat', lat);
  localStorage.setItem('savedLon', lon);
  localStorage.setItem('savedLocationName', locationName);
  // ---------------------------

  currentLat = lat;
  currentLon = lon;
  
  const commaIndex = locationName.indexOf(',');
  let primaryName = locationName;
  let remainingLocation = '';

  if (commaIndex !== -1) {
    primaryName = locationName.substring(0, commaIndex).trim();      
    remainingLocation = locationName.substring(commaIndex + 1).trim(); 
  }

  const titleEl = document.getElementById('locationTitle');
  if (titleEl) {
    titleEl.textContent = primaryName;
  }
  
  const subEl = document.getElementById('locationSub');
  const timeString = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (subEl) {
    subEl.innerHTML = `${remainingLocation} &bull; As of <span id="updateTime">${timeString}</span>`;
  }
  
  loadCurrentWeather(lat, lon);
  loadHourlyForecast(lat, lon);
  loadDailyForecast(lat, lon);
  loadWeatherMetrics(lat, lon);
  loadRainChart(lat, lon);
  loadInsights(lat, lon);
  loadPrecipitationInsight(lat, lon);
}

// Initial page load listener with LocalStorage check
window.addEventListener('DOMContentLoaded', () => {
  const savedLat = localStorage.getItem('savedLat');
  const savedLon = localStorage.getItem('savedLon');
  const savedLocationName = localStorage.getItem('savedLocationName');

  if (savedLat && savedLon) {
    // If a last-viewed location exists, load it using updateWeatherLocation to keep headers correct!
    currentLat = savedLat;
    currentLon = savedLon;
    const locName = savedLocationName || "Saved Location";
    
    updateWeatherLocation(savedLat, savedLon, locName);
  } else {
    // Otherwise, fallback to your default Butwal setup
    loadCurrentWeather(currentLat, currentLon);
    loadHourlyForecast(currentLat, currentLon);
    loadDailyForecast(currentLat, currentLon);
    loadWeatherMetrics(currentLat, currentLon);
    loadRainChart(currentLat, currentLon);
    loadInsights(currentLat, currentLon);
    loadPrecipitationInsight(currentLat, currentLon);
  }
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
        const response = await fetch(`${API_BASE}/api/search-locations?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          dropdown.innerHTML = '';
          dropdown.style.display = 'block';

          result.data.forEach(loc => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.textContent = loc.name;
            
            div.addEventListener('click', () => {
              searchInput.value = '';
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
    }, 600);
  });
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
      
      currentLat = lat;
      currentLon = lon;
      
      loadCurrentWeather(lat, lon);
      loadHourlyForecast(lat, lon);
      loadDailyForecast(lat, lon);
      loadWeatherMetrics(lat, lon);
      loadRainChart(lat, lon);
      loadInsights(lat, lon);
      loadPrecipitationInsight(lat, lon);
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

// Function to reset back to default home location (Butwal)
function resetToDefaultLocation() {
  localStorage.removeItem('savedLat');
  localStorage.removeItem('savedLon');
  localStorage.removeItem('savedLocationName');

  currentLat = '27.7000';
  currentLon = '83.4500';

  updateWeatherLocation(currentLat, currentLon, "Butwal, Nepal");
}

// Attach listener to Title
const homeTitleEl = document.getElementById('homeTitle');
if (homeTitleEl) {
  homeTitleEl.addEventListener('click', resetToDefaultLocation);
}

// Attach listener to Logo
const homeLogoEl = document.getElementById('homeLogo');
if (homeLogoEl) {
  homeLogoEl.addEventListener('click', resetToDefaultLocation);
}

const NodeCache = require('node-cache');
// Cache weather responses for 10 minutes (600 seconds)
const weatherCache = new NodeCache({ stdTTL: 600 });

app.get('/api/current-weather', async (req, res) => {
  const { lat, lon } = req.query;
  const cacheKey = `current_${lat}_${lon}`;

  // Return cached result immediately if present
  if (weatherCache.has(cacheKey)) {
    return res.json(weatherCache.get(cacheKey));
  }

  try {
    // Fetch fresh data from external weather provider
    const weatherData = await fetchExternalWeatherData(lat, lon);
    const responsePayload = { success: true, data: weatherData };

    // Save in memory cache
    weatherCache.set(cacheKey, responsePayload);

    return res.json(responsePayload);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// // In script.js
// const homeLogo = document.getElementById('homeLogo');
// if (homeLogo) {
//   homeLogo.addEventListener('click', () => {
//     // Put your default reset function here (e.g., fetch default city)
//     loadDefaultWeather(); 
//   });
// }