package com.example.nepalweatherforecast

import android.Manifest
import android.content.Context
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

        val prefs = getSharedPreferences("nwf_weather_prefs", MODE_PRIVATE)

        // Pre-store default fallback weather data if empty so the app loads numbers in 0.01 seconds
        if (!prefs.contains("nwf_cache_current")) {
            val defaultCurrent = """{"cityName":"Lumbini Province, Nepal","region":"Nepal","temperature":29,"feelsLike":34,"condition":"Fair","humidity":76,"precipChance":4,"uvIndex":0,"iconCode":30}"""
            val defaultMetrics = """{"temperature":29,"tempMax":32,"tempMin":25,"feelsLike":34,"windSpeed":11,"windDirText":"N","humidity":76,"uvIndex":0,"uvDescription":"Low","dewPoint":24,"pressure":1010.42,"visibility":6,"airQuality":106,"sunrise":"6:03 AM","sunset":"5:57 PM","moonrise":"9:11 PM","moonset":"10:47 AM","moonPhase":"Waning Gibbous"}"""
            val defaultInsight = "Fair weather conditions expected. Warm daytime temperatures."
            prefs.edit()
                .putString("nwf_cache_current", defaultCurrent)
                .putString("nwf_cache_metrics", defaultMetrics)
                .putString("nwf_cache_insight", defaultInsight)
                .apply()
        }

        // Wake up Render backend & fetch fresh weather data natively in parallel
        val endpoints = mapOf(
            "nwf_cache_current" to "https://nepal-weather-forecast-backend.onrender.com/api/current-weather?lat=27.7000&lon=83.4500",
            "nwf_cache_hourly" to "https://nepal-weather-forecast-backend.onrender.com/api/hourly-forecast?lat=27.7000&lon=83.4500",
            "nwf_cache_daily" to "https://nepal-weather-forecast-backend.onrender.com/api/daily-forecast?lat=27.7000&lon=83.4500",
            "nwf_cache_metrics" to "https://nepal-weather-forecast-backend.onrender.com/api/weather-metrics?lat=27.7000&lon=83.4500",
            "nwf_cache_insight" to "https://nepal-weather-forecast-backend.onrender.com/api/insights?lat=27.7000&lon=83.4500"
        )

        for ((key, urlStr) in endpoints) {
            thread {
                try {
                    val conn = URL(urlStr).openConnection() as HttpURLConnection
                    conn.connectTimeout = 8000
                    conn.readTimeout = 8000
                    conn.requestMethod = "GET"
                    if (conn.responseCode == 200) {
                        val text = conn.inputStream.bufferedReader().use { it.readText() }
                        if (text.contains("\"success\":true") || text.contains("insight")) {
                            prefs.edit().putString(key, text).apply()
                        }
                    }
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

    // Hide splash overlay quickly (0.8s) so user sees instantly cached UI
    LaunchedEffect(Unit) {
        delay(800)
        isLoading = false
    }

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
            AndroidView(
                factory = { context ->
                    SwipeRefreshLayout(context).apply {
                        setColorSchemeColors(android.graphics.Color.parseColor("#3B82F6"))
                        setProgressBackgroundColorSchemeColor(android.graphics.Color.parseColor("#1E293B"))

                        val prefs = context.getSharedPreferences("nwf_weather_prefs", Context.MODE_PRIVATE)

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

                            val injectCache = {
                                val curJson = prefs.getString("nwf_cache_current", "") ?: ""
                                val metJson = prefs.getString("nwf_cache_metrics", "") ?: ""
                                val hrlJson = prefs.getString("nwf_cache_hourly", "") ?: ""
                                val dayJson = prefs.getString("nwf_cache_daily", "") ?: ""
                                val insJson = prefs.getString("nwf_cache_insight", "") ?: ""

                                val js = """
                                    (function() {
                                        try {
                                            var timeEl = document.getElementById('updateTime');
                                            if (timeEl) {
                                                var now = new Date();
                                                timeEl.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                                            }

                                            if ('$curJson' !== '') {
                                                var curData = '$curJson';
                                                var parsed = JSON.parse(curData);
                                                var d = parsed.data || parsed;
                                                localStorage.setItem('nwf_cache_current', JSON.stringify(d));
                                                if (typeof renderCachedCurrent === 'function') renderCachedCurrent(d);
                                            }
                                            if ('$metJson' !== '') {
                                                var metData = '$metJson';
                                                var parsedM = JSON.parse(metData);
                                                var m = parsedM.data || parsedM;
                                                localStorage.setItem('nwf_cache_metrics', JSON.stringify(m));
                                                if (typeof renderCachedMetrics === 'function') renderCachedMetrics(m);
                                            }
                                            if ('$hrlJson' !== '') {
                                                var hrlData = '$hrlJson';
                                                var parsedH = JSON.parse(hrlData);
                                                var h = parsedH.data || parsedH;
                                                localStorage.setItem('nwf_cache_hourly', JSON.stringify(h));
                                                if (typeof renderCachedHourly === 'function') renderCachedHourly(h);
                                            }
                                            if ('$dayJson' !== '') {
                                                var dayData = '$dayJson';
                                                var parsedD = JSON.parse(dayData);
                                                var dy = parsedD.data || parsedD;
                                                localStorage.setItem('nwf_cache_daily', JSON.stringify(dy));
                                                if (typeof renderCachedDaily === 'function') renderCachedDaily(dy);
                                            }
                                            if ('$insJson' !== '') {
                                                var insData = '$insJson';
                                                try {
                                                    var pIns = JSON.parse(insData);
                                                    var tIns = pIns.insight || pIns;
                                                    if (typeof tIns === 'string') {
                                                        localStorage.setItem('nwf_cache_insight', tIns);
                                                        if (typeof renderCachedInsight === 'function') renderCachedInsight(tIns);
                                                    }
                                                } catch(e) {
                                                    localStorage.setItem('nwf_cache_insight', insData);
                                                    if (typeof renderCachedInsight === 'function') renderCachedInsight(insData);
                                                }
                                            }
                                        } catch(e) {}
                                    })();
                                """.trimIndent()
                                evaluateJavascript(js, null)
                            }

                            webViewClient = object : WebViewClient() {
                                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                                    super.onPageStarted(view, url, favicon)
                                    canGoBack = view?.canGoBack() == true
                                    injectCache()
                                }

                                override fun onPageFinished(view: WebView?, url: String?) {
                                    super.onPageFinished(view, url)
                                    canGoBack = view?.canGoBack() == true
                                    injectCache()
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
