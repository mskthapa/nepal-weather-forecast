package com.example.nepalweatherforecast

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import kotlinx.coroutines.delay
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class MainActivity : ComponentActivity() {

    private var pendingGeoCallback: GeolocationPermissions.Callback? = null
    private var pendingGeoOrigin: String? = null

    private val requestLocationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        pendingGeoCallback?.invoke(pendingGeoOrigin, granted, false)
        pendingGeoCallback = null
        pendingGeoOrigin = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Wake up / Pre-warm Render backend endpoints instantly on app start
        val apiEndpoints = listOf(
            "https://nepal-weather-forecast-backend.onrender.com/api/current-weather?lat=27.7000&lon=83.4500",
            "https://nepal-weather-forecast-backend.onrender.com/api/hourly-forecast?lat=27.7000&lon=83.4500",
            "https://nepal-weather-forecast-backend.onrender.com/api/daily-forecast?lat=27.7000&lon=83.4500",
            "https://nepal-weather-forecast-backend.onrender.com/api/weather-metrics?lat=27.7000&lon=83.4500"
        )

        for (endpoint in apiEndpoints) {
            thread {
                try {
                    val url = URL(endpoint)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 8000
                    conn.readTimeout = 8000
                    conn.requestMethod = "GET"
                    conn.connect()
                    conn.inputStream.close()
                } catch (_: Exception) {}
            }
        }

        setContent {
            WeatherAppContent(
                onRequestLocation = { origin, callback ->
                    if (ContextCompat.checkSelfPermission(
                            this,
                            Manifest.permission.ACCESS_FINE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED
                    ) {
                        callback.invoke(origin, true, false)
                    } else {
                        pendingGeoCallback = callback
                        pendingGeoOrigin = origin
                        requestLocationPermissionLauncher.launch(
                            arrayOf(
                                Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION
                            )
                        )
                    }
                }
            )
        }
    }
}

@Composable
fun WeatherAppContent(
    onRequestLocation: (origin: String, callback: GeolocationPermissions.Callback) -> Unit
) {
    var webView: WebView? by remember { mutableStateOf(null) }
    var canGoBack by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(true) }
    var isRefreshing by remember { mutableStateOf(false) }

    val appBackgroundColor = Color(0xFF0F172A) // Sleek dark slate matching website background (#0f172a)

    BackHandler(enabled = canGoBack) {
        webView?.goBack()
    }

    // Hide splash screen overlay after max 1.8 seconds so user sees UI/cache immediately
    LaunchedEffect(Unit) {
        delay(1800)
        isLoading = false
    }

    // JavaScript injection to enable instant local storage caching & fast rendering
    val instantCacheScript = """
        (function() {
            try {
                // Restore cached current weather instantly
                var cur = localStorage.getItem('nwf_cache_current');
                if (cur) {
                    var data = JSON.parse(cur);
                    if (data) {
                        if (data.cityName && document.getElementById('locationTitle')) {
                            document.getElementById('locationTitle').textContent = data.cityName;
                        }
                        if (data.temperature && document.getElementById('currentTemp')) {
                            document.getElementById('currentTemp').textContent = data.temperature;
                        }
                        if (data.condition && document.getElementById('currentCondition')) {
                            document.getElementById('currentCondition').textContent = data.condition;
                        }
                        if (data.feelsLike && document.getElementById('feelsLike')) {
                            document.getElementById('feelsLike').textContent = data.feelsLike;
                        }
                        if (data.humidity && document.getElementById('humidity')) {
                            document.getElementById('humidity').textContent = data.humidity;
                        }
                    }
                }

                // Restore cached metrics instantly
                var met = localStorage.getItem('nwf_cache_metrics');
                if (met) {
                    var m = JSON.parse(met);
                    if (m) {
                        var setVal = function(id, val) {
                            var el = document.getElementById(id);
                            if (el && val !== undefined && val !== null) el.textContent = val;
                        };
                        setVal('metricTemp', m.temperature ? m.temperature + '°' : '');
                        setVal('metricFeelsLike', m.feelsLike ? m.feelsLike + '°' : '');
                        setVal('metricWindSpeed', m.windSpeed ? m.windSpeed + ' km/h' : '');
                        setVal('metricWindDir', m.windDirText || '');
                        setVal('metricHumidity', m.humidity ? m.humidity + '%' : '');
                        setVal('metricUvIndex', m.uvIndex || '');
                        setVal('metricAirQuality', m.airQuality || '');
                        setVal('metricSunrise', m.sunrise || '');
                        setVal('metricSunset', m.sunset || '');
                        setVal('metricMoonrise', m.moonrise || '');
                        setVal('metricMoonset', m.moonset || '');
                        setVal('metricMoonPhase', m.moonPhase || '');
                    }
                }
            } catch(e) {}

            // Intercept fetch to store successful API responses in localStorage
            if (!window.__nwf_fetch_intercepted) {
                window.__nwf_fetch_intercepted = true;
                var origFetch = window.fetch;
                window.fetch = function() {
                    var url = arguments[0];
                    return origFetch.apply(this, arguments).then(function(resp) {
                        if (resp && resp.ok && typeof url === 'string') {
                            var clone = resp.clone();
                            clone.json().then(function(json) {
                                if (json && json.success && json.data) {
                                    if (url.indexOf('/api/current-weather') !== -1) {
                                        localStorage.setItem('nwf_cache_current', JSON.stringify(json.data));
                                    } else if (url.indexOf('/api/weather-metrics') !== -1) {
                                        localStorage.setItem('nwf_cache_metrics', JSON.stringify(json.data));
                                    }
                                }
                            }).catch(function(){});
                        }
                        return resp;
                    });
                };
            }
        })();
    """.trimIndent()

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(appBackgroundColor)
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(appBackgroundColor)
        ) {
            // SwipeRefreshLayout wrapping WebView
            AndroidView(
                factory = { context ->
                    SwipeRefreshLayout(context).apply {
                        setColorSchemeColors(android.graphics.Color.parseColor("#3B82F6"))
                        setProgressBackgroundColorSchemeColor(android.graphics.Color.parseColor("#1E293B"))

                        val wv = WebView(context).apply {
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                            setBackgroundColor(android.graphics.Color.parseColor("#0F172A"))

                            settings.apply {
                                javaScriptEnabled = true
                                domStorageEnabled = true
                                @Suppress("DEPRECATION")
                                databaseEnabled = true
                                setGeolocationEnabled(true)
                                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                                useWideViewPort = true
                                loadWithOverviewMode = true
                                cacheMode = WebSettings.LOAD_DEFAULT
                                allowFileAccess = true
                                allowContentAccess = true
                            }

                            webViewClient = object : WebViewClient() {
                                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                                    super.onPageStarted(view, url, favicon)
                                    canGoBack = view?.canGoBack() == true
                                    view?.evaluateJavascript(instantCacheScript, null)
                                }

                                override fun onPageFinished(view: WebView?, url: String?) {
                                    super.onPageFinished(view, url)
                                    canGoBack = view?.canGoBack() == true
                                    view?.evaluateJavascript(instantCacheScript, null)

                                    // Automatic background polling if server was cold-starting
                                    view?.evaluateJavascript(
                                        """
                                        (function() {
                                            var retries = 0;
                                            var timer = setInterval(function() {
                                                var tempEl = document.getElementById('currentTemp');
                                                if (tempEl && (tempEl.textContent === '--' || tempEl.textContent === '' || tempEl.textContent.indexOf('28') !== -1)) {
                                                    if (typeof loadCurrentWeather === 'function') loadCurrentWeather();
                                                    if (typeof loadHourlyForecast === 'function') loadHourlyForecast();
                                                    if (typeof loadDailyForecast === 'function') loadDailyForecast();
                                                    if (typeof loadWeatherMetrics === 'function') loadWeatherMetrics();
                                                } else {
                                                    clearInterval(timer);
                                                }
                                                retries++;
                                                if (retries > 6) clearInterval(timer);
                                            }, 1200);
                                        })();
                                        """.trimIndent(),
                                        null
                                    )

                                    isLoading = false
                                    isRefreshing = false
                                }
                            }

                            webChromeClient = object : WebChromeClient() {
                                override fun onGeolocationPermissionsShowPrompt(
                                    origin: String,
                                    callback: GeolocationPermissions.Callback
                                ) {
                                    onRequestLocation(origin, callback)
                                }
                            }

                            loadUrl("https://nepalweatherforecast.netlify.app/")
                        }

                        webView = wv
                        addView(wv)

                        setOnRefreshListener {
                            isRefreshing = true
                            wv.reload()
                        }
                    }
                },
                update = { swipeRefresh ->
                    swipeRefresh.isRefreshing = isRefreshing
                },
                modifier = Modifier.fillMaxSize()
            )

            // Loading / Splash Screen Overlay
            AnimatedVisibility(
                visible = isLoading,
                exit = fadeOut(),
                modifier = Modifier.fillMaxSize()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(appBackgroundColor),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.nwfloading),
                            contentDescription = "Loading Logo",
                            modifier = Modifier.size(200.dp)
                        )
                        CircularProgressIndicator(
                            color = Color(0xFF3B82F6),
                            strokeWidth = 3.dp,
                            modifier = Modifier.size(230.dp)
                        )
                    }
                }
            }
        }
    }
}
