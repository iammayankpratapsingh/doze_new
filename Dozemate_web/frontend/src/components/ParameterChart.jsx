import { Line } from "react-chartjs-2";
import "./ParameterChart.css";
import { useRef, useEffect } from "react";
import { IconButton } from "@mui/material";
import { ZoomIn, ZoomOut, Refresh } from "@mui/icons-material";

const TIME_TICK_COLORS = ["#7c3aed", "#0ea5e9"];
const CURRENT_TICK_COLOR = "#f97316";

const getAlternateTickColor = (context) => {
    const index = context?.index ?? 0;
    return TIME_TICK_COLORS[index % TIME_TICK_COLORS.length];
};

const isCurrentMinute = (value) => {
    if (!value) return false;
    const tickTime = new Date(value);
    const now = new Date();
    return (
        tickTime.getHours() === now.getHours() &&
        tickTime.getMinutes() === now.getMinutes()
    );
};

const ParameterChart = ({
    title,
    unit,
    labels,
    dataPoints,
    min,
    max,
    borderColor,
    backgroundColor,
    xMin,     // <-- NEW
    xMax,    // <-- NEW,
    scaleType = "time",   // 👈 NEW prop: "time" | "category"
    enableZoomLevels = false,  // 👈 NEW: Enable zoom level controls
    zoomLevel = null,          // 👈 NEW: Current zoom level ID
    onZoomIn = null,           // 👈 NEW: Zoom in handler
    onZoomOut = null,          // 👈 NEW: Zoom out handler
    zoomLevels = [],           // 👈 NEW: Available zoom levels
    onPan = null,              // 👈 NEW: Pan event handler (manual scroll detection)
    onReset = null             // 👈 NEW: Reset handler
}) => {
    const chartRef = useRef(null);
    const isAutoScrollDisabledRef = useRef(false);
    
    // Update chart xMin/xMax when they change (only if both are defined - auto-scroll enabled)
    useEffect(() => {
        if (!chartRef.current || scaleType !== "time") return;
        
        const chart = chartRef.current;
        
        // If auto-scroll is disabled (xMin/xMax undefined), don't update chart at all
        if (xMin === undefined || xMax === undefined) {
            isAutoScrollDisabledRef.current = true;
            // Don't update chart - preserve user's scroll position
            return;
        }
        
        // Auto-scroll enabled: update xMin/xMax
        isAutoScrollDisabledRef.current = false;
        const newMin = xMin.getTime();
        const newMax = xMax.getTime();
        const currentMin = chart.options.scales.x.min;
        const currentMax = chart.options.scales.x.max;
        
        // Only update if values are different
        if (currentMin !== newMin || currentMax !== newMax) {
            chart.options.scales.x.min = newMin;
            chart.options.scales.x.max = newMax;
            chart.update('none');
        }
    }, [xMin, xMax, scaleType]);
    
    const sanitizedData = (dataPoints ?? []).map((raw) => {
        if (raw === null || raw === undefined) return null;
        const numeric = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(numeric)) return null;
        return Number(numeric.toFixed(2));
    });

    const data = {
        labels,
        datasets: [
            {
                label: "",
                data: sanitizedData,
                borderColor,
                backgroundColor,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                borderWidth: 2,
                spanGaps: false,
            },
        ],
    };


    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0, // Disable animation for smooth updates without redraw
        },
        transitions: {
            active: {
                animation: {
                    duration: 0,
                },
            },
        },
        interaction: { mode: "index", intersect: false },
        scales: {
            y: {
                min,  // use prop value
                max,  // use prop value
                ticks: {
                    color: (context) => getAlternateTickColor(context),
                    font: { size: 12, weight: "600" },
                },
                grid: {
                    display: false,
                },
            },
            x:
                scaleType === "time"
                    ? {
                        type: "time",
                        // Only set min/max if both are defined (auto-scroll enabled)
                        // When undefined, chart will use its current view (preserves scroll position)
                        min: (xMin && xMax) ? xMin.getTime() : undefined,
                        max: (xMin && xMax) ? xMax.getTime() : undefined,
                        bounds: xMin && xMax ? "ticks" : "data", // Use "data" when xMin/xMax undefined to preserve scroll
                        time: {
                            unit: "minute",
                            tooltipFormat: "HH:mm",
                            displayFormats: { minute: "HH:mm" },
                        },
                        ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: true,
                            color: (context) =>
                                isCurrentMinute(context?.tick?.value)
                                    ? CURRENT_TICK_COLOR
                                    : getAlternateTickColor(context),
                            font: { size: 12 },
                        },
                        grid: { display: false },
                    }
                    : {
                        type: "category", // 👈 works for RR Intervals / RawWaveform
                        ticks: {
                            color: (context) => getAlternateTickColor(context),
                            font: { size: 12, weight: "600" },
                            autoSkip: true,
                        },
                        grid: { display: false },
                    },
        },
        plugins: {
            legend: { display: false },
            datalabels: {
                anchor: 'end',
                align: 'top',
                color: '#444',
                font: { size: 10, weight: 'bold' },
                display: (ctx) => {
                    const dataset = ctx.chart.data.datasets[ctx.datasetIndex];
                    return ctx.dataIndex === dataset.data.length - 1; // ✅ only last point
                },
                formatter: (value) =>
                    typeof value === "number" ? value.toFixed(2) : "",
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: "x",              // ✅ drag left/right to scroll
                    overScaleMode: "x",
                    threshold: 8,
                    onPanStart: () => {
                        // Detect manual panning start (scrolling)
                        if (onPan) {
                            onPan();
                        }
                    },
                    onPan: () => {
                        // Detect manual panning (scrolling)
                        if (onPan) {
                            onPan();
                        }
                    },
                    onPanComplete: () => {
                        // Pan completed - ensure auto-scroll is disabled
                        if (onPan) {
                            onPan();
                        }
                    },
                },
                zoom: {
                    wheel: { enabled: true },   // ✅ mouse wheel zoom
                    pinch: { enabled: true },   // ✅ touch pinch zoom
                    mode: "x",
                },
            },

        },
    };

    const validPoints = (dataPoints ?? []).filter(
        (d) => typeof d === "number" && isFinite(d)
    );
    const hasPoints = validPoints.length > 0;
    const safeMin = hasPoints ? Math.min(...validPoints) : null;
    const safeMax = hasPoints ? Math.max(...validPoints) : null;

    return (
        <div className="param-chart-wrapper">
            <div className="chart-title">
                <span>{title}</span>
                <span className="minmax">
                    Min: {hasPoints ? safeMin.toFixed(2) : "-"} {unit} | Max: {hasPoints ? safeMax.toFixed(2) : "-"} {unit}
                </span>
            </div>
            <div className="chart-canvas">


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>
                        {enableZoomLevels && zoomLevel && (
                            <span style={{ fontSize: "12px", color: "#666" }}>
                                {zoomLevels.find(z => z.id === zoomLevel)?.label || zoomLevel}
                            </span>
                        )}
                    </span>
                    <div>
                        {enableZoomLevels ? (
                            <>
                                <IconButton 
                                    size="small" 
                                    onClick={onZoomOut} 
                                    title="Zoom Out"
                                    disabled={!onZoomOut}
                                >
                                    <ZoomOut fontSize="small" />
                                </IconButton>
                                <IconButton 
                                    size="small" 
                                    onClick={onZoomIn} 
                                    title="Zoom In"
                                    disabled={!onZoomIn}
                                >
                                    <ZoomIn fontSize="small" />
                                </IconButton>
                                <IconButton 
                                    size="small" 
                                    onClick={() => {
                                        // Reset zoom and call onReset handler
                                        chartRef.current?.resetZoom();
                                        if (onReset) {
                                            onReset();
                                        }
                                    }} 
                                    title="Reset to Current Time"
                                >
                                    <Refresh fontSize="small" />
                                </IconButton>
                            </>
                        ) : (
                            <>
                                <IconButton size="small" onClick={() => chartRef.current?.zoom(1.2)} title="Zoom In">
                                    <ZoomIn fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => chartRef.current?.zoom(0.8)} title="Zoom Out">
                                    <ZoomOut fontSize="small" />
                                </IconButton>
                                <IconButton 
                                    size="small" 
                                    onClick={() => {
                                        chartRef.current?.resetZoom();
                                        if (onReset) {
                                            onReset();
                                        }
                                    }} 
                                    title="Reset Zoom"
                                >
                                    <Refresh fontSize="small" />
                                </IconButton>
                            </>
                        )}
                    </div>
                </div>


                <Line ref={chartRef} data={data} options={options} />
            </div>

        </div>
    );
};

export default ParameterChart;
