import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { setupMqttMode } from "../../services/mqttMode";
import { setupDatabaseMode } from "../../services/databaseMode";
import { disconnectMQTT } from "../../mqtt/mqtt";
import "./Dashboard.css";
import ParameterChart from "../../components/ParameterChart";
import { fetchHealthData } from "../../services/healthDataService";
import metricsConfig from "../../config/metricsConfig";
import { apiUrl } from "../../config/api";

Chart.register(...registerables, zoomPlugin, ChartDataLabels);

const MAX_STORAGE_MINUTES = 1440; // 24 hours
const DISPLAY_WINDOW_MINUTES = 30; // Window size
const RIGHT_MARGIN_MINUTES = 2; // 2 minutes margin on the right when live
const RESPIRATION_BUCKET_SECONDS = 30; // Server aggregation bucket
const STRESS_ZOOM_LEVELS = [
    { id: "30m", label: "30m", minutes: 30, bucketSeconds: 30 },
    { id: "60m", label: "60m", minutes: 60, bucketSeconds: 60 },
    { id: "120m", label: "2h", minutes: 120, bucketSeconds: 120 },
    { id: "8h", label: "8h", minutes: 480, bucketSeconds: 480 },
    { id: "24h", label: "24h", minutes: 1440, bucketSeconds: 1440 },
];

// Heart Rate Zoom Levels Configuration
const HEART_RATE_ZOOM_LEVELS = [
    { id: "15m", label: "15m", minutes: 15, avgSeconds: 6 },      // No averaging needed
    { id: "1h", label: "1h", minutes: 60, avgSeconds: 24 },       // 4 points avg
    { id: "2h", label: "2h", minutes: 120, avgSeconds: 48 },      // 8 points avg
    { id: "4h", label: "4h", minutes: 240, avgSeconds: 96 },      // 16 points avg
    { id: "8h", label: "8h", minutes: 480, avgSeconds: 192 },    // 32 points avg
    { id: "12h", label: "12h", minutes: 720, avgSeconds: 288 },  // 48 points avg
    { id: "24h", label: "24h", minutes: 1440, avgSeconds: 376 },  // ~63 points avg
];

const mergeStressSeries = (existingLabels = [], existingData = [], incomingLabels = [], incomingData = []) => {
    const combined = new Map();

    existingLabels.forEach((label, index) => {
        const ts = label instanceof Date ? label.getTime() : new Date(label).getTime();
        if (!Number.isNaN(ts)) {
            combined.set(ts, existingData[index] ?? null);
        }
    });

    incomingLabels.forEach((label, index) => {
        const ts = label instanceof Date ? label.getTime() : new Date(label).getTime();
        if (!Number.isNaN(ts)) {
            combined.set(ts, incomingData[index] ?? null);
        }
    });

    const sortedKeys = Array.from(combined.keys()).sort((a, b) => a - b);

    return {
        labels: sortedKeys.map((ts) => new Date(ts)),
        data: sortedKeys.map((ts) => combined.get(ts)),
    };
};

// Heart Rate Aggregation Function
const aggregateHeartRateData = (rawLabels = [], rawData = [], zoomLevelConfig) => {
    if (!rawLabels.length || !rawData.length) {
        return { labels: [], data: [] };
    }

    const { avgSeconds } = zoomLevelConfig;
    
    // For 15m zoom level (6 sec avg), return data as-is (no aggregation needed)
    if (avgSeconds === 6) {
        // Ensure labels are Date objects
        const processedLabels = rawLabels.map(label => 
            label instanceof Date ? label : new Date(label)
        );
        
        // Return ALL data for 15m (24 hours), no filtering, no downsampling
        // xMin/xMax will handle the visible window
        // User wants all 24 hours data preserved
        return {
            labels: processedLabels,
            data: rawData,
        };
    }

    // For other zoom levels, aggregate data
    // Sab data use karein, time window filter nahi
    const dataPoints = [];
    for (let i = 0; i < rawLabels.length; i++) {
        const labelTime = rawLabels[i] instanceof Date ? rawLabels[i].getTime() : new Date(rawLabels[i]).getTime();
        if (!Number.isNaN(labelTime)) {
            dataPoints.push({
                timestamp: labelTime,
                value: rawData[i],
            });
        }
    }

    if (dataPoints.length === 0) {
        return { labels: [], data: [] };
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => a.timestamp - b.timestamp);

    // Create buckets based on avgSeconds
    const bucketSizeMs = avgSeconds * 1000;
    const buckets = new Map();

    dataPoints.forEach((point) => {
        if (point.value === null || point.value === undefined) return;
        
        // Calculate which bucket this point belongs to
        const bucketKey = Math.floor(point.timestamp / bucketSizeMs) * bucketSizeMs;
        
        if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, []);
        }
        buckets.get(bucketKey).push(point.value);
    });

    // Calculate average for each bucket
    const aggregated = [];
    const aggregatedLabels = [];
    const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
    
    sortedBuckets.forEach(([bucketTime, values]) => {
        const validValues = values.filter(v => v !== null && v !== undefined && isFinite(v));
        if (validValues.length > 0) {
            const avg = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
            aggregatedLabels.push(new Date(bucketTime));
            aggregated.push(Number(avg.toFixed(2)));
        }
    });

    // If we have more than 150 points, downsample to 150 (but keep last point)
    if (aggregated.length > 150) {
        const step = (aggregated.length - 1) / 149; // 149 intervals to keep last point
        const downsampled = [];
        const downsampledLabels = [];
        
        // Always include first point
        downsampled.push(aggregated[0]);
        downsampledLabels.push(aggregatedLabels[0]);
        
        // Sample middle points
        for (let i = 1; i < 149; i++) {
            const idx = Math.floor(1 + (i - 1) * step);
            if (idx < aggregated.length - 1) {
                downsampled.push(aggregated[idx]);
                downsampledLabels.push(aggregatedLabels[idx]);
            }
        }
        
        // Always include last point
        downsampled.push(aggregated[aggregated.length - 1]);
        downsampledLabels.push(aggregatedLabels[aggregatedLabels.length - 1]);
        
        return {
            labels: downsampledLabels,
            data: downsampled,
        };
    }

    return {
        labels: aggregatedLabels,
        data: aggregated,
    };
};



// Global connection state to persist across re-renders
let globalConnectionState = {
    isConnected: false,
    mode: "database",
    mqttClient: null
};

const Dashboard = React.memo(() => {
    console.log("Dashboard component rendering..."); // Debug log

    const [graphConfig, setGraphConfig] = useState({});
    // Declare all hooks at the top
    const chartRef = useRef(null);
    const isInitializedRef = useRef(false);

    const [data, setData] = useState({
        temperature: null,
        humidity: null,
        iaq: null,
        co2: null,
        tvoc: null,
        bvoc: null,
        hrv: null,
        stress: null,
        sdnn: null,
        rmssd: null,
        lf_pow: null,
        hf_pow: null,
        lf_hf_ratio: null,
        motion: null,
        presence: null,
        activity: null,
        mic: null
    });

    const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark'));
    const [showMoreGraphs, setShowMoreGraphs] = useState(false);

    // Memoize the getTextColor function
    const getTextColor = useCallback(() => {
        return isDark ? '#e0e0e0' : '#555555';
    }, [isDark]);

    const [chartData, setChartData] = useState(() => {
        const storedData = localStorage.getItem("chartData");
        return storedData
            ? JSON.parse(storedData)
            : {
                labels: [],
                datasets: [
                    { label: "Respiration", data: [], borderColor: "rgba(54,162,235,1)", backgroundColor: "rgba(54,162,235,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Heart Rate", data: [], borderColor: "rgba(255,99,132,1)", backgroundColor: "rgba(255,99,132,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Temperature", data: [], borderColor: "rgba(255,165,0,1)", backgroundColor: "rgba(255,165,0,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Humidity", data: [], borderColor: "rgba(75,192,192,1)", backgroundColor: "rgba(75,192,192,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "IAQ", data: [], borderColor: "rgba(153,102,255,1)", backgroundColor: "rgba(153,102,255,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "eCO₂", data: [], borderColor: "rgba(0,128,0,1)", backgroundColor: "rgba(0,128,0,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "TVOC", data: [], borderColor: "rgba(255,206,86,1)", backgroundColor: "rgba(255,206,86,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "Stress", data: [], borderColor: "rgba(199,21,133,1)", backgroundColor: "rgba(199,21,133,0.2)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                    { label: "bVOC", data: [], borderColor: "rgba(0,128,128,1)", backgroundColor: "rgba(0,128,128,0.1)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 3 },

                ],
            };
    });
    const [respirationAggregatedState, setRespirationAggregatedState] = useState({
        labels: [],
        data: []
    });
    const [stressAggregateCache, setStressAggregateCache] = useState({});
    const [stressZoomLevel, setStressZoomLevel] = useState(STRESS_ZOOM_LEVELS[0].id);
    const [heartRateZoomLevel, setHeartRateZoomLevel] = useState(HEART_RATE_ZOOM_LEVELS[0].id);
    const [isHeartRateAutoScrolling, setIsHeartRateAutoScrolling] = useState(true);

    // ✅ Derived from chartData (single source of truth)
    const labels = useMemo(() => chartData.labels || [], [chartData]);

    const respiration = useMemo(() => {
        return chartData.datasets?.find(ds => ds.label === "Respiration")?.data || [];
    }, [chartData]);
    const { labels: respAggLabels, data: respAggData } = respirationAggregatedState;
    const respirationChartLabels = useMemo(
        () => (respAggLabels.length ? respAggLabels : labels),
        [respAggLabels, labels]
    );
    const respirationChartData = useMemo(
        () => (respAggData.length ? respAggData : respiration),
        [respAggData, respiration]
    );

    const heartRate = useMemo(() => {
        return chartData.datasets?.find(ds => ds.label === "Heart Rate")?.data || [];
    }, [chartData]);

    // Aggregated Heart Rate data based on zoom level
    const heartRateZoomConfig = useMemo(() => {
        return HEART_RATE_ZOOM_LEVELS.find(level => level.id === heartRateZoomLevel) || HEART_RATE_ZOOM_LEVELS[0];
    }, [heartRateZoomLevel]);

    const aggregatedHeartRate = useMemo(() => {
        const rawHeartRate = heartRate;
        const rawLabels = labels;
        
        if (!rawHeartRate.length || !rawLabels.length) {
            return { labels: [], data: [] };
        }

        const result = aggregateHeartRateData(rawLabels, rawHeartRate, heartRateZoomConfig);
        
        // Debug log for 15m zoom level
        if (heartRateZoomConfig.avgSeconds === 6) {
            console.log('15m Zoom - Raw labels:', rawLabels.length, 'Raw data:', rawHeartRate.length, 'Result labels:', result.labels.length, 'Result data:', result.data.length);
        }
        
        return result;
    }, [labels, heartRate, heartRateZoomConfig]);

    const heartRateChartLabels = useMemo(() => {
        return aggregatedHeartRate.labels.length > 0 ? aggregatedHeartRate.labels : labels;
    }, [aggregatedHeartRate.labels, labels]);

    const heartRateChartData = useMemo(() => {
        return aggregatedHeartRate.data.length > 0 ? aggregatedHeartRate.data : heartRate;
    }, [aggregatedHeartRate.data, heartRate]);

    // Heart Rate x-axis window based on zoom level
    // Only update xMin/xMax when auto-scroll is enabled
    const heartRateXWindow = useMemo(() => {
        // Only update window if auto-scroll is enabled
        // If disabled, return undefined to preserve user's scroll position
        if (!isHeartRateAutoScrolling) {
            return { xMin: undefined, xMax: undefined };
        }
        
        // Auto-scroll enabled: update window based on current time
        const now = Date.now();
        const windowMinutes = heartRateZoomConfig.minutes;
        
        // xMin: show last N minutes from current time (zoom level based)
        // xMax: always show 1 minute ahead of current time
        const xMin = new Date(now - windowMinutes * 60_000);
        const xMax = new Date(now + 1 * 60_000);
        return { xMin, xMax };
    }, [heartRateZoomConfig.minutes, isHeartRateAutoScrolling]);

    const temperature = useMemo(() => {
        return chartData.datasets?.find(ds => ds.label === "Temperature")?.data || [];
    }, [chartData]);



    const humidity = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "Humidity")?.data || [],
        [chartData]
    );

    const iaq = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "IAQ")?.data || [],
        [chartData]
    );

    const co2 = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "eCO₂")?.data || [],
        [chartData]
    );

    const tvoc = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "TVOC")?.data || [],
        [chartData]
    );

    const sdnn = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "SDNN")?.data || [],
        [chartData]
    );

    const rmssd = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "RMSSD")?.data || [],
        [chartData]
    );

    const bvoc = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "bVOC")?.data || [],
        [chartData]
    );

    const [mode, setMode] = useState(() => globalConnectionState.mode);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    const graphChoice = (key) => {
        return graphConfig[key] ?? metricsConfig[key]?.graph ?? "NA";
    };

    const getXWindow = useCallback(() => {
        const now = Date.now();
        const xMin = new Date(now - DISPLAY_WINDOW_MINUTES * 60_000);
        const xMax = new Date(now - RIGHT_MARGIN_MINUTES * 60_000);
        return { xMin, xMax };
    }, []);

    const { xMin, xMax } = getXWindow();

    const stressZoomConfig = useMemo(
        () => STRESS_ZOOM_LEVELS.find(level => level.id === stressZoomLevel) ?? STRESS_ZOOM_LEVELS[0],
        [stressZoomLevel]
    );

    const currentStressCache = stressAggregateCache[stressZoomLevel] || {
        labels: [],
        data: [],
        windowStart: null,
        windowEnd: null,
        bucketSeconds: stressZoomConfig.bucketSeconds,
    };
    const [autoStressScroll, setAutoStressScroll] = useState(true);

    const stress = useMemo(
        () => chartData.datasets?.find(ds => ds.label === "Stress")?.data || [],
        [chartData]
    );
    const stressChartLabels = useMemo(
        () => (currentStressCache.labels?.length ? currentStressCache.labels : labels),
        [currentStressCache.labels, labels]
    );
    const stressChartData = useMemo(
        () => (currentStressCache.data?.length ? currentStressCache.data : stress),
        [currentStressCache.data, stress]
    );
    const stressXWindow = useMemo(() => {
        if (stressChartLabels.length && autoStressScroll) {
            const latest = stressChartLabels[stressChartLabels.length - 1];
            const ts = latest instanceof Date ? latest.getTime() : new Date(latest).getTime();
            if (!Number.isNaN(ts)) {
                const windowSize = stressZoomConfig.minutes * 60_000;
                return {
                    xMin: new Date(ts - windowSize),
                    xMax: new Date(ts),
                };
            }
        }
        if (!autoStressScroll && stressChartLabels.length) {
            if (currentStressCache.windowStart && currentStressCache.windowEnd) {
                return {
                    xMin: new Date(currentStressCache.windowStart),
                    xMax: new Date(currentStressCache.windowEnd),
                };
            }
            return { xMin: undefined, xMax: undefined };
        }
        return getXWindow();
    }, [
        stressChartLabels,
        stressZoomConfig.minutes,
        currentStressCache.windowStart,
        currentStressCache.windowEnd,
        getXWindow,
        autoStressScroll
    ]);

    const [selectedDeviceId, setSelectedDeviceId] = useState(null);

    // After fetching devices for user
    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch(apiUrl("/api/manage/users/me"), { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(user => {
                if (user.devices?.length) {
                    console.log(user.devices);
                    setSelectedDeviceId(user.devices[0].deviceId); // pick first
                }
            });
    }, []);

    // Initialize connection only once
    useEffect(() => {
        if (isInitializedRef.current) return;

        console.log("Initializing Dashboard connection..."); // Debug log
        isInitializedRef.current = true;

        const initializeConnection = async () => {
            if (mode === "mqtt") {
                try {
                    const client = await setupMqttMode(setData, setChartData, chartRef, isAutoScrolling);
                    globalConnectionState.mqttClient = client;
                    globalConnectionState.isConnected = true;
                    globalConnectionState.mode = "mqtt";
                } catch (error) {
                    console.error("Failed to setup MQTT:", error);
                }
            } else {
                setupDatabaseMode(setData, setChartData, chartRef);
                globalConnectionState.isConnected = true;
                globalConnectionState.mode = "database";
            }
        };

        initializeConnection();

        // Cleanup function that only runs on component unmount
        return () => {
            console.log("Dashboard component unmounting..."); // Debug log
            if (globalConnectionState.mqttClient) {
                disconnectMQTT();
                globalConnectionState.mqttClient = null;
            }
            globalConnectionState.isConnected = false;
            isInitializedRef.current = false;
        };
    }, []); // Empty dependency array - only run once

    // Handle mode changes separately
    useEffect(() => {
        if (!isInitializedRef.current) return;

        const handleModeChange = async () => {
            if (globalConnectionState.mode !== mode) {
                console.log(`Switching mode from ${globalConnectionState.mode} to ${mode}`); // Debug log

                // Disconnect existing connection
                if (globalConnectionState.mqttClient) {
                    disconnectMQTT();
                    globalConnectionState.mqttClient = null;
                }

                // Setup new connection
                if (mode === "mqtt") {
                    try {
                        const client = await setupMqttMode(setData, setChartData, chartRef, isAutoScrolling);
                        globalConnectionState.mqttClient = client;
                    } catch (error) {
                        console.error("Failed to setup MQTT:", error);
                    }
                } else {
                    setupDatabaseMode(setData, setChartData, chartRef);
                }

                globalConnectionState.mode = mode;
            }
        };

        handleModeChange();
    }, [mode, isAutoScrolling]);

    const loadLiveChartData = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!selectedDeviceId) return;

        const now = new Date();
        const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // last 1h
        const end = now.toISOString();

        try {
            const historyPromise = fetch(
                apiUrl(`/api/devices/history?deviceId=${selectedDeviceId}&from=${start}&to=${end}&limit=500`),
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const respirationAggPromise = fetch(
                apiUrl(`/api/devices/history/respiration?deviceId=${selectedDeviceId}&windowMinutes=${DISPLAY_WINDOW_MINUTES}&bucketSeconds=${RESPIRATION_BUCKET_SECONDS}`),
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const [historyRes, respirationAggRes] = await Promise.all([historyPromise, respirationAggPromise]);
            if (!historyRes.ok) {
                throw new Error(`History fetch failed with status ${historyRes.status}`);
            }
            const json = await historyRes.json();
            let respirationAggJson = null;
            if (respirationAggRes.ok) {
                respirationAggJson = await respirationAggRes.json();
            } else {
                console.warn("Respiration aggregation fetch failed:", respirationAggRes.status);
            }
            console.log("📊 /devices/history result:", json);

            const rows = Array.isArray(json) ? json : json.data || [];
            const summary = json.summary || {};
            console.log("✅ Parsed rows for charts:", rows.length);
            const newLabels = rows.map((r) => new Date(r.timestamp));
            const newHeartRate = rows.map((r) => r.heartRate);
            const newRespiration = rows.map((r) => r.respiration);
            const newTemperature = rows.map((r) => r.temperature);
            const newHumidity = rows.map((r) => r.humidity);
            const newIaq = rows.map((r) => r.iaq);
            const newCo2 = rows.map((r) => r.co2 ?? r.eco2);
            const newTvoc = rows.map((r) => r.tvoc);
            const newStress = rows.map((r) => r.stress);
            const newBvoc = rows.map((r) => r.bvoc);

            // ✅ Update main live metrics + summary
            setData((prev) => ({
                ...prev,
                heartRate: summary.avgHR ?? newHeartRate.at(-1),
                respiration: newRespiration.at(-1),
                temperature: newTemperature.at(-1),
                humidity: newHumidity.at(-1),
                iaq: newIaq.at(-1),
                co2: newCo2.at(-1),
                tvoc: newTvoc.at(-1),
                stress: newStress.at(-1),
                bvoc: newBvoc.at(-1),
                summaryHR: summary, // store min/avg/max here
            }));

            // ✅ Update charts
            setChartData({
                labels: newLabels,
                datasets: [
                    {
                        label: "Heart Rate",
                        data: newHeartRate,
                        borderColor: "rgba(255,99,132,1)",
                        backgroundColor: "rgba(255,99,132,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Respiration",
                        data: newRespiration,
                        borderColor: "rgba(54,162,235,1)",
                        backgroundColor: "rgba(54,162,235,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Temperature",
                        data: newTemperature,
                        borderColor: "rgba(255,165,0,1)",
                        backgroundColor: "rgba(255,165,0,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Humidity",
                        data: newHumidity,
                        borderColor: "rgba(75,192,192,1)",
                        backgroundColor: "rgba(75,192,192,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "IAQ",
                        data: newIaq,
                        borderColor: "rgba(153,102,255,1)",
                        backgroundColor: "rgba(153,102,255,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "eCO₂",
                        data: newCo2,
                        borderColor: "rgba(0,128,0,1)",
                        backgroundColor: "rgba(0,128,0,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "TVOC",
                        data: newTvoc,
                        borderColor: "rgba(255,206,86,1)",
                        backgroundColor: "rgba(255,206,86,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "Stress",
                        data: newStress,
                        borderColor: "rgba(199,21,133,1)",
                        backgroundColor: "rgba(199,21,133,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                    {
                        label: "bVOC",
                        data: newBvoc,
                        borderColor: "rgba(0,128,128,1)",
                        backgroundColor: "rgba(0,128,128,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 3,
                    },
                ],
            });

            if (respirationAggJson?.points) {
                const aggLabels = [];
                const aggData = [];
                respirationAggJson.points.forEach((point) => {
                    const ts = new Date(point.timestamp);
                    if (Number.isNaN(ts.getTime())) return;
                    aggLabels.push(ts);
                    aggData.push(point.value ?? null);
                });
                setRespirationAggregatedState({ labels: aggLabels, data: aggData });
            } else {
                setRespirationAggregatedState({ labels: [], data: [] });
            }
        } catch (error) {
            console.error("Live chart data fetch failed:", error);
        }
    }, [selectedDeviceId]);

    const fetchStressAggregation = useCallback(async () => {
        if (!selectedDeviceId) return;
        const token = localStorage.getItem("token");
        const level = stressZoomConfig;
        const end = new Date();
        const start = new Date(end.getTime() - level.minutes * 60_000);
        const levelId = level.id;

        try {
            const res = await fetch(
                apiUrl(`/api/devices/history/stress?deviceId=${selectedDeviceId}&from=${start.toISOString()}&to=${end.toISOString()}&bucketSeconds=${level.bucketSeconds}`),
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) {
                throw new Error(`Stress aggregation failed with status ${res.status}`);
            }

            const json = await res.json();
            const points = Array.isArray(json.points) ? json.points : [];
            const windowStart = json.window?.start ?? start.toISOString();
            const windowEnd = json.window?.end ?? end.toISOString();
            const bucketSeconds = json.bucketSeconds ?? level.bucketSeconds;

            if (!points.length) {
                setStressAggregateCache(prev => {
                    const prevLevel = prev[levelId];
                    if (!prevLevel) {
                        return {
                            ...prev,
                            [levelId]: {
                                labels: [],
                                data: [],
                                windowStart,
                                windowEnd,
                                bucketSeconds,
                            },
                        };
                    }

                    if (
                        prevLevel.windowStart === windowStart &&
                        prevLevel.windowEnd === windowEnd &&
                        prevLevel.bucketSeconds === bucketSeconds
                    ) {
                        return prev;
                    }

                    return {
                        ...prev,
                        [levelId]: {
                            ...prevLevel,
                            windowStart,
                            windowEnd,
                            bucketSeconds,
                        },
                    };
                });
                return;
            }

            const aggLabels = [];
            const aggData = [];

            points.forEach(point => {
                const ts = new Date(point.timestamp);
                if (Number.isNaN(ts.getTime())) return;
                aggLabels.push(ts);
                aggData.push(point.value ?? null);
            });

            if (!aggLabels.length) {
                return;
            }

            setStressAggregateCache(prev => {
                const prevLevel = prev[levelId] || {
                    labels: [],
                    data: [],
                    windowStart: null,
                    windowEnd: null,
                    bucketSeconds,
                };

                const merged = mergeStressSeries(prevLevel.labels, prevLevel.data, aggLabels, aggData);
                const mergedStart = merged.labels.length ? merged.labels[0].toISOString() : windowStart;
                const mergedEnd = merged.labels.length ? merged.labels[merged.labels.length - 1].toISOString() : windowEnd;

                return {
                    ...prev,
                    [levelId]: {
                        labels: merged.labels,
                        data: merged.data,
                        windowStart: mergedStart,
                        windowEnd: mergedEnd,
                        bucketSeconds,
                    },
                };
            });

            // ensure live window follows latest point
            setAutoStressScroll(true);
        } catch (error) {
            console.error("Stress aggregation fetch failed:", error);
        }
    }, [selectedDeviceId, stressZoomConfig]);


    const inAlert = (key, value) => {
        if (value == null) return false;

        // Prefer dynamic config from DB
        const min = graphConfig[key]?.alertMin ?? metricsConfig[key]?.alertMin;
        const max = graphConfig[key]?.alertMax ?? metricsConfig[key]?.alertMax;

        if (min == null && max == null) return false;
        if (min != null && value < min) return true;
        if (max != null && value > max) return true;

        return false;
    };

    const COLOR_CLASSES = {
        temp: 'rose-pink',
        humidity: 'light-apricot',
        iaq: 'soft-yellow',
        co2: 'cool-mint',
        tvoc: 'sky-mist',
        etoh: 'lavender-fog',
        hrv: 'light-steel',
        stress: 'coral-peach',
    };

    const ValueCard = ({ title, unit, dataPoints }) => {
        const latest = dataPoints.length ? dataPoints.at(-1) : "—";

        console.log("📊 Updating Dashboard state:", {
            temperature: latest.temperature,
            humidity: latest.humidity,
            co2: latest.eco2,
            tvoc: latest.tvoc,
            heartRate: latest.heartRate,
            respiration: latest.respiration,
        });
        return (
            <div className="value-card">
                <h4>{title}</h4>
                <p>{latest}{latest !== "—" ? ` ${unit}` : ""}</p>
            </div>
        );
    };


    // Update chart colors when theme changes
    useEffect(() => {
        const updateChartTheme = () => {
            const newIsDark = document.body.classList.contains('dark');
            setIsDark(newIsDark);

            if (!chartRef.current) return;

            const textColor = newIsDark ? '#e0e0e0' : '#555555';

            // Update legend colors
            chartRef.current.options.plugins.legend.labels.color = textColor;

            // Update axis colors
            chartRef.current.options.scales.x.ticks.color = textColor;
            chartRef.current.options.scales.y.ticks.color = textColor;

            // Update datalabel background
            chartRef.current.options.plugins.datalabels.backgroundColor =
                newIsDark ? 'rgba(45, 45, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)';

            chartRef.current.update();
        };

        // Create observer to watch for class changes on body
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    updateChartTheme();
                }
            });
        });

        // Start observing
        observer.observe(document.body, { attributes: true });

        // Call once to set initial colors
        updateChartTheme();

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!selectedDeviceId) return;
        loadLiveChartData();
        const interval = setInterval(loadLiveChartData, 6000);
        return () => clearInterval(interval);
    }, [selectedDeviceId, loadLiveChartData]);

    useEffect(() => {
        setStressAggregateCache({});
    }, [selectedDeviceId]);

    useEffect(() => {
        if (!selectedDeviceId) return;
        if (graphChoice("stress") !== "Line") return;
        setAutoStressScroll(true);
        fetchStressAggregation();
        const intervalMs = Math.max(stressZoomConfig.bucketSeconds, 30) * 1000;
        const interval = setInterval(fetchStressAggregation, intervalMs);
        return () => clearInterval(interval);
    }, [selectedDeviceId, fetchStressAggregation, stressZoomConfig.bucketSeconds, graphConfig]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch(apiUrl("/api/graph-settings"), {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const map = {};
                console.log("Graph settings API response:", data);

                const settings = Array.isArray(data) ? data : data.settings || [];
                settings.forEach(s => {
                    map[s.metric] = s.selectedType;
                });

                setGraphConfig(map);
            })

    }, []);


    return (
        <div className="dashboard-container">
            <div className="dashboard-wrapper">
                {/* Dashboard Header */}
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Health Monitoring Dashboard</h1>
                    <p className="dashboard-subtitle">Real-time health metrics and analytics for optimal wellness tracking</p>
                </div>

                {/* Metrics Cards Grid */}
                <div className="metrics-cards-grid">
                    {[
                        "heartRate", "respiration", "stress", "temperature", "humidity", "iaq", "bvoc", "co2", "tvoc"
                    ]
                    .filter(key => graphChoice(key) === "Value" || graphChoice(key) === "Line")
                    .map((key, index) => {
                        // Simple 2-color alternating pattern
                        const colorClass = index % 2 === 0 ? 'card-baby-lavender' : 'card-baby-sky';

                        return (
                            <div key={key} className={`metric-card ${colorClass}`}>
                                <div className="metric-card-label">
                                    {{
                                        heartRate: "Heart Rate",
                                        respiration: "Respiration",
                                        temperature: "Temp",
                                        humidity: "Humidity",
                                        stress: "Stress",
                                        iaq: "IAQ",
                                        bvoc: "bVOC",
                                        co2: "CO₂",
                                        tvoc: "TVOC"
                                    }[key]}
                                </div>
                                <div
                                    className={`metric-card-value ${["heartRate", "respiration", "temperature", "humidity", "stress"].includes(key) &&
                                        inAlert(key, data[key])
                                        ? "alert"
                                        : ""
                                        }`}
                                >
                                    {key === "respiration"
                                        ? respiration.length
                                            ? `${respiration.at(-1)}`
                                            : "—"
                                        : key === "heartRate"
                                            ? data.summaryHR?.avgHR
                                                ? `${data.summaryHR.avgHR.toFixed(1)}`
                                                : heartRate.length
                                                    ? `${heartRate.at(-1)}`
                                                    : "—"
                                            : data[key] != null
                                                ? `${Number(data[key]).toFixed(
                                                    ["temperature", "humidity", "iaq", "co2", "tvoc", "bvoc"].includes(key) ? 1 : 0
                                                )}`
                                                : "—"}
                                </div>
                                <div className="metric-card-unit">
                                    {key === "respiration"
                                        ? "rpm"
                                        : key === "heartRate"
                                            ? "bpm"
                                            : data[key] != null
                                                ? {
                                                    heartRate: "bpm",
                                                    respiration: "rpm",
                                                    temperature: "°C",
                                                    humidity: "%",
                                                    stress: "",
                                                    iaq: "",
                                                    bvoc: "ppb",
                                                    co2: "ppm",
                                                    tvoc: "ppb"
                                                }[key] || ""
                                                : ""}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="param-chart-grid">
                {/* ====== Time-series charts per Excel (Line only) ====== */}
                {graphChoice("heartRate") === "Line" && (
                    <ParameterChart
                        title="Heart Rate"
                        unit="bpm"
                        labels={heartRateChartLabels}
                        dataPoints={heartRateChartData}
                        min={metricsConfig.heartRate.min}
                        max={metricsConfig.heartRate.max}
                        borderColor="rgba(255, 99, 132, 1)"
                        backgroundColor="rgba(255, 99, 132, 0.1)"
                        xMin={heartRateXWindow.xMin}
                        xMax={heartRateXWindow.xMax}
                        enableZoomLevels={true}
                        zoomLevel={heartRateZoomLevel}
                        zoomLevels={HEART_RATE_ZOOM_LEVELS}
                        onZoomIn={() => {
                            // Zoom In = show less time = move to previous level (lower index)
                            const currentIndex = HEART_RATE_ZOOM_LEVELS.findIndex(level => level.id === heartRateZoomLevel);
                            if (currentIndex > 0) {
                                setHeartRateZoomLevel(HEART_RATE_ZOOM_LEVELS[currentIndex - 1].id);
                            }
                        }}
                        onZoomOut={() => {
                            // Zoom Out = show more time = move to next level (higher index)
                            const currentIndex = HEART_RATE_ZOOM_LEVELS.findIndex(level => level.id === heartRateZoomLevel);
                            if (currentIndex < HEART_RATE_ZOOM_LEVELS.length - 1) {
                                setHeartRateZoomLevel(HEART_RATE_ZOOM_LEVELS[currentIndex + 1].id);
                            }
                        }}
                        onPan={() => {
                            // User manually scrolled, disable auto-scroll
                            setIsHeartRateAutoScrolling(false);
                        }}
                        onReset={() => {
                            // Reset to current time and enable auto-scroll
                            setIsHeartRateAutoScrolling(true);
                        }}
                    />
                )}

                {graphChoice("heartRate") === "Value" && (
                    <ValueCard
                        title="Heart Rate"
                        unit="bpm"
                        dataPoints={heartRate}
                    />
                )}

                {graphChoice("respiration") === "Line" && (
                    <ParameterChart
                        title="Respiration"
                        unit="rpm"
                        labels={respirationChartLabels}
                        dataPoints={respirationChartData}
                        min={metricsConfig.respiration.min}
                        max={metricsConfig.respiration.max}
                        borderColor="rgba(54, 162, 235, 1)"
                        backgroundColor="rgba(54, 162, 235, 0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("respiration") === "Value" && (
                    <ValueCard title="Respiration" unit="rpm" dataPoints={respiration} />
                )}

                {graphChoice("stress") === "Line" && (
                    <div className="param-chart-stack">
                        <div className="chart-control-bar">
                            <span>Stress window</span>
                            <div className="chart-control-actions">
                                {STRESS_ZOOM_LEVELS.map(level => (
                                    <button
                                        key={level.id}
                                        type="button"
                                        className={`chart-control-button ${level.id === stressZoomLevel ? "active" : ""}`}
                                        onClick={() => {
                                            setStressZoomLevel(level.id);
                                            setAutoStressScroll(true);
                                        }}
                                    >
                                        {level.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className={`chart-control-button ${autoStressScroll ? "active" : ""}`}
                                    onClick={() => setAutoStressScroll(true)}
                                >
                                    Live
                                </button>
                            </div>
                        </div>
                        <ParameterChart
                            title="Stress"
                            unit=""
                            labels={stressChartLabels}
                            dataPoints={stressChartData}
                            min={metricsConfig.stress.min}
                            max={metricsConfig.stress.max}
                            borderColor="rgba(199,21,133,1)"
                            backgroundColor="rgba(199,21,133,0.1)"
                            xMin={stressXWindow.xMin}
                            xMax={stressXWindow.xMax}
                        />
                    </div>
                )}

                {graphChoice("stress") === "Value" && (
                    <ValueCard title="Stress" unit="" dataPoints={stress} />
                )}

                {graphChoice("temperature") === "Line" && (
                    <ParameterChart
                        title="Temperature"
                        unit="°C"
                        labels={labels}
                        dataPoints={temperature}
                        min={metricsConfig.temperature.min}
                        max={metricsConfig.temperature.max}
                        borderColor="rgba(255,165,0,1)"
                        backgroundColor="rgba(255,165,0,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("temperature") === "Value" && (
                    <ValueCard title="Temperature" unit="°C" dataPoints={temperature} />
                )}

                {graphChoice("humidity") === "Line" && (
                    <ParameterChart
                        title="Humidity"
                        unit="%"
                        labels={labels}
                        dataPoints={humidity}
                        min={metricsConfig.humidity.min}
                        max={metricsConfig.humidity.max}
                        borderColor="rgba(75,192,192,1)"
                        backgroundColor="rgba(75,192,192,0.1)"
                        xMin={xMin}
                        xMax={xMax}
                    />
                )}

                {graphChoice("humidity") === "Value" && (
                    <ValueCard title="Humidity" unit="%" dataPoints={humidity} />
                )}

                {/* View More Button - Only show when graphs are hidden */}
                {!showMoreGraphs && (
                    <div style={{ width: '100%', textAlign: 'center', margin: '2rem 0', position: 'relative' }}>
                        <hr style={{ 
                            border: 'none', 
                            borderTop: '1px solid #e5e7eb', 
                            margin: '0 0 1rem 0',
                            width: '100%'
                        }} />
                        <button
                            onClick={() => setShowMoreGraphs(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#3b82f6',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textUnderlineOffset: '4px',
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = '#3b82f6';
                            }}
                        >
                            View More
                        </button>
                    </div>
                )}

                {/* Additional Graphs - Hidden by default */}
                {showMoreGraphs && (
                    <>
                        {graphChoice("iaq") === "Line" && (
                            <ParameterChart
                                title="IAQ"
                                unit=""
                                labels={labels}
                                dataPoints={iaq}
                                min={metricsConfig.iaq.min}
                                max={metricsConfig.iaq.max}
                                borderColor="rgba(153,102,255,1)"
                                backgroundColor="rgba(153,102,255,0.1)"
                                xMin={xMin}
                                xMax={xMax}
                            />
                        )}

                        {graphChoice("iaq") === "Value" && (
                            <ValueCard title="IAQ" unit="" dataPoints={iaq} />
                        )}

                        {graphChoice("co2") === "Line" && (
                            <ParameterChart
                                title="eCO₂"
                                unit="ppm"
                                labels={labels}
                                dataPoints={co2}
                                min={metricsConfig.co2.min}
                                max={metricsConfig.co2.max}
                                borderColor="rgba(0,128,0,1)"
                                backgroundColor="rgba(0,128,0,0.1)"
                                xMin={xMin}
                                xMax={xMax}
                            />
                        )}

                        {graphChoice("co2") === "Value" && (
                            <ValueCard title="eCO₂" unit="ppm" dataPoints={co2} />
                        )}

                        {graphChoice("tvoc") === "Line" && (
                            <ParameterChart
                                title="TVOC"
                                unit="ppb"
                                labels={labels}
                                dataPoints={tvoc}
                                min={metricsConfig.tvoc.min}
                                max={metricsConfig.tvoc.max}
                                borderColor="rgba(255,206,86,1)"
                                backgroundColor="rgba(255,206,86,0.1)"
                                xMin={xMin}
                                xMax={xMax}
                            />
                        )}

                        {graphChoice("tvoc") === "Value" && (
                            <ValueCard title="TVOC" unit="ppb" dataPoints={tvoc} />
                        )}

                        {graphChoice("sdnn") === "Line" && (
                            <ParameterChart
                                title="SDNN"
                                unit="ms"
                                labels={labels}
                                dataPoints={sdnn}
                                min={metricsConfig.sdnn.min}
                                max={metricsConfig.sdnn.max}
                                borderColor="rgba(100,149,237,1)"
                                backgroundColor="rgba(100,149,237,0.1)"
                                xMin={xMin}
                                xMax={xMax}
                            />
                        )}
                        {graphChoice("sdnn") === "Value" && (
                            <ValueCard title="SDNN" unit="ms" dataPoints={sdnn} />
                        )}
                        {graphChoice("rmssd") === "Line" && (
                            <ParameterChart
                                title="RMSSD"
                                unit="ms"
                                labels={labels}
                                dataPoints={rmssd}
                                min={metricsConfig.rmssd.min}
                                max={metricsConfig.rmssd.max}
                                borderColor="rgba(255,140,0,1)"
                                backgroundColor="rgba(255,140,0,0.1)"
                                xMin={xMin}
                                xMax={xMax}
                            />
                        )}
                        {graphChoice("rmssd") === "Value" && (
                            <ValueCard title="RMSSD" unit="ms" dataPoints={rmssd} />
                        )}

                        {graphChoice("bvoc") === "Line" && (
                            <ParameterChart
                                title="bVOC"
                                unit="ppb"
                                labels={labels}
                                dataPoints={bvoc}
                                min={metricsConfig.bvoc.min}
                                max={metricsConfig.bvoc.max}
                                borderColor="rgba(0,128,128,1)"
                                backgroundColor="rgba(0,128,128,0.1)"
                                xMin={xMin}
                                xMax={xMax}
                            />
                        )}
                        {graphChoice("bvoc") === "Value" && (
                            <ValueCard title="bVOC" unit="ppb" dataPoints={bvoc} />
                        )}

                        {/* Show Less Button - After all graphs */}
                        <div style={{ width: '100%', textAlign: 'center', margin: '2rem 0', position: 'relative' }}>
                            <hr style={{ 
                                border: 'none', 
                                borderTop: '1px solid #e5e7eb', 
                                margin: '0 0 1rem 0',
                                width: '100%'
                            }} />
                            <button
                                onClick={() => setShowMoreGraphs(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#3b82f6',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '4px',
                                    transition: 'color 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = '#2563eb';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = '#3b82f6';
                                }}
                            >
                                Show Less
                            </button>
                        </div>
                    </>
                )}

            </div>


        </div>
    );
});

// Add display name for debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard;