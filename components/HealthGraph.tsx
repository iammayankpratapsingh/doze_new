import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, Line, Circle, G, Text as SvgText, Rect } from 'react-native-svg';

// Zoom level configurations
export type ZoomLevel = {
  name: string;
  durationMs: number; // Total time window in milliseconds
  sampleWindowMs: number; // Sampling window for averaging in milliseconds
};

export const ZOOM_LEVELS: ZoomLevel[] = [
  { name: '15min', durationMs: 15 * 60 * 1000, sampleWindowMs: 6 * 1000 }, // 6 sec average
  { name: '1hour', durationMs: 60 * 60 * 1000, sampleWindowMs: 24 * 1000 }, // 24 sec average
  { name: '2hours', durationMs: 2 * 60 * 60 * 1000, sampleWindowMs: 48 * 1000 }, // 48 sec average
  { name: '4hours', durationMs: 4 * 60 * 60 * 1000, sampleWindowMs: 96 * 1000 }, // 96 sec average
  { name: '8hours', durationMs: 8 * 60 * 60 * 1000, sampleWindowMs: 192 * 1000 }, // 192 sec average
  { name: '12hours', durationMs: 12 * 60 * 60 * 1000, sampleWindowMs: 288 * 1000 }, // 288 sec average
  { name: '24hours', durationMs: 24 * 60 * 60 * 1000, sampleWindowMs: 376 * 1000 }, // 376 sec average
];

export interface HealthDataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  value: number; // Heart rate value (BPM)
}

export interface HealthGraphProps {
  rawData: HealthDataPoint[]; // Array of {timestamp, value} points
  initialZoomLevel?: number; // Index into ZOOM_LEVELS array (default: last = 24 hours)
  onZoomChange?: (zoomLevel: ZoomLevel, domain: { x: [number, number] }) => void;
  height?: number;
  yAxisLabel?: string;
  lineColor?: string;
  areaColor?: string;
  minY?: number;
  maxY?: number;
}

/**
 * Downsample data by averaging values within time windows
 */
function downsampleData(
  data: HealthDataPoint[],
  startTime: number,
  endTime: number,
  sampleWindowMs: number
): HealthDataPoint[] {
  if (data.length === 0) return [];

  // Filter data to visible range
  const visibleData = data.filter(
    (point) => point.timestamp >= startTime && point.timestamp <= endTime
  );

  if (visibleData.length === 0) return [];

  // Create time buckets
  const buckets: Map<number, number[]> = new Map();
  const startBucket = Math.floor(startTime / sampleWindowMs) * sampleWindowMs;

  visibleData.forEach((point) => {
    const bucketTime = Math.floor(point.timestamp / sampleWindowMs) * sampleWindowMs;
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, []);
    }
    buckets.get(bucketTime)!.push(point.value);
  });

  // Average values in each bucket
  const downsampled: HealthDataPoint[] = [];
  buckets.forEach((values, bucketTime) => {
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    downsampled.push({
      timestamp: bucketTime + sampleWindowMs / 2, // Center of the bucket
      value: avgValue,
    });
  });

  // Sort by timestamp
  downsampled.sort((a, b) => a.timestamp - b.timestamp);

  return downsampled;
}

export const HealthGraph: React.FC<HealthGraphProps> = ({
  rawData,
  initialZoomLevel = 0, // Default to 15 minutes
  onZoomChange,
  height = 450,
  yAxisLabel = 'BPM',
  lineColor = '#FF6B6B',
  areaColor = 'rgba(255, 107, 107, 0.2)',
  minY,
  maxY,
}) => {
  // Sort raw data by timestamp
  const sortedData = useMemo(() => {
    return [...rawData]
      .filter((d) => !isNaN(d.timestamp) && !isNaN(d.value) && isFinite(d.value) && d.value > 0)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [rawData]);

  // Calculate initial domain for 15 minutes
  const initialDomain = useMemo(() => {
    if (sortedData.length === 0) {
      const now = Date.now();
      return {
        x: [now - ZOOM_LEVELS[0].durationMs, now] as [number, number],
        y: [minY !== undefined ? minY : 40, maxY !== undefined ? maxY : 100] as [number, number],
      };
    }

    const lastTimestamp = sortedData[sortedData.length - 1].timestamp;
    const endTime = lastTimestamp;
    const startTime = endTime - ZOOM_LEVELS[0].durationMs; // 15 minutes

    // Calculate Y domain
    const visibleData = sortedData.filter(
      (d) => d.timestamp >= startTime && d.timestamp <= endTime && !isNaN(d.value) && isFinite(d.value)
    );
    const values = visibleData.map((d) => d.value).filter((v) => !isNaN(v) && isFinite(v));
    const dataMinY = values.length > 0 ? Math.min(...values) : 0;
    const dataMaxY = values.length > 0 ? Math.max(...values) : 100;
    const yMin = minY !== undefined ? minY : Math.max(0, dataMinY - 10);
    const yMax = maxY !== undefined ? maxY : (dataMaxY + 10);

    return {
      x: [startTime, endTime] as [number, number],
      y: [yMin, yMax] as [number, number],
    };
  }, [sortedData, minY, maxY]);

  // Downsample data for current view (15 minutes)
  const chartData = useMemo(() => {
    if (sortedData.length === 0) return [];

    try {
      const [startTime, endTime] = initialDomain.x;
      
      // Validate domain
      if (!isFinite(startTime) || !isFinite(endTime) || startTime >= endTime) {
        return [];
      }

      const downsampled = downsampleData(
        sortedData,
        startTime,
        endTime,
        ZOOM_LEVELS[0].sampleWindowMs // 6 seconds for 15-minute view
      );

      return downsampled.filter((point) => isFinite(point.timestamp) && isFinite(point.value) && point.value > 0);
    } catch (error) {
      console.error('[HealthGraph] Error processing chart data:', error);
      return [];
    }
  }, [sortedData, initialDomain]);

  // Calculate Y domain with padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) {
      return [minY !== undefined ? minY : 40, maxY !== undefined ? maxY : 100] as [number, number];
    }

    const values = chartData.map((d) => d.value).filter((v) => !isNaN(v) && isFinite(v));
    if (values.length === 0) {
      return [minY !== undefined ? minY : 40, maxY !== undefined ? maxY : 100] as [number, number];
    }

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const padding = (dataMax - dataMin) * 0.1 || 10;

    const yMin = minY !== undefined ? minY : Math.max(0, dataMin - padding);
    const yMax = maxY !== undefined ? maxY : dataMax + padding;

    return [yMin, yMax] as [number, number];
  }, [chartData, minY, maxY]);

  // Chart dimensions - Full width, edge to edge like professional apps
  const screenWidth = Dimensions.get('window').width;
  const chartPadding = 55;
  const chartWidth = screenWidth; // Full screen width
  const chartHeight = height; // Full height
  const availableWidth = chartWidth - chartPadding * 2;
  const availableHeight = chartHeight - chartPadding * 2;

  // Format time for X-axis labels - 24 hour format (HH:MM)
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours(); // 0-23
    const minutes = date.getMinutes(); // 0-59
    // Return 24-hour format: HH:MM (no AM/PM)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  if (sortedData.length === 0 || chartData.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No data available</Text>
          <Text style={styles.emptyStateSubtext}>Connect your device to see heart rate data</Text>
        </View>
      </View>
    );
  }

  // Validate domain before rendering
  if (!isFinite(initialDomain.x[0]) || !isFinite(initialDomain.x[1]) || !isFinite(yDomain[0]) || !isFinite(yDomain[1])) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Invalid data</Text>
          <Text style={styles.emptyStateSubtext}>Please refresh the screen</Text>
        </View>
      </View>
    );
  }

  // Calculate chart points
  const [startTime, endTime] = initialDomain.x;
  const [yMin, yMax] = yDomain;
  const timeRange = endTime - startTime;
  const valueRange = yMax - yMin;

  // Generate X-axis time labels (6 labels for 15 minutes)
  const timeLabels = useMemo(() => {
    const labels = [];
    const labelCount = 6;
    for (let i = 0; i <= labelCount; i++) {
      const time = startTime + (timeRange * i) / labelCount;
      labels.push({
        time,
        x: chartPadding + (availableWidth * i) / labelCount,
        label: formatTime(time),
      });
    }
    return labels;
  }, [startTime, timeRange, chartPadding, availableWidth]);

  // Generate Y-axis labels
  const yLabels = useMemo(() => {
    const labels = [];
    const labelCount = 5;
    for (let i = 0; i <= labelCount; i++) {
      const value = yMax - (valueRange * i) / labelCount;
      const y = chartPadding + (availableHeight * i) / labelCount;
      labels.push({ value: Math.round(value), y });
    }
    return labels;
  }, [yMin, yMax, valueRange, chartPadding, availableHeight]);

  // Generate path for line and area
  const linePath = useMemo(() => {
    if (chartData.length === 0) return '';

    let path = '';
    let areaPath = '';

    chartData.forEach((point, index) => {
      const x = chartPadding + ((point.timestamp - startTime) / timeRange) * availableWidth;
      const y = chartPadding + availableHeight - ((point.value - yMin) / valueRange) * availableHeight;

      if (index === 0) {
        path = `M ${x} ${y}`;
        areaPath = `M ${x} ${chartPadding + availableHeight} L ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    });

    // Close area path
    if (chartData.length > 0) {
      const lastX = chartPadding + ((chartData[chartData.length - 1].timestamp - startTime) / timeRange) * availableWidth;
      areaPath += ` L ${lastX} ${chartPadding + availableHeight} Z`;
    }

    return { linePath: path, areaPath };
  }, [chartData, startTime, timeRange, yMin, valueRange, chartPadding, availableWidth, availableHeight]);

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Y-axis label */}
        <SvgText
          x={10}
          y={chartHeight / 2}
          fill="rgba(255,255,255,0.6)"
          fontSize="11"
          fontWeight="600"
          transform={`rotate(-90, 10, ${chartHeight / 2})`}
          textAnchor="middle"
        >
          {yAxisLabel}
        </SvgText>

        {/* Y-axis labels */}
        {yLabels.map((label, index) => (
          <React.Fragment key={`y-label-${index}`}>
            <SvgText
              x={chartPadding - 10}
              y={label.y + 4}
              fill="rgba(255,255,255,0.7)"
              fontSize="10"
              textAnchor="end"
            >
              {label.value}
            </SvgText>
            <Line
              x1={chartPadding}
              y1={label.y}
              x2={chartPadding + availableWidth}
              y2={label.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          </React.Fragment>
        ))}

        {/* X-axis grid lines */}
        {timeLabels.map((label, index) => (
          <Line
            key={`x-grid-${index}`}
            x1={label.x}
            y1={chartPadding}
            x2={label.x}
            y2={chartPadding + availableHeight}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Area under curve */}
        {linePath.areaPath && (
          <Path
            d={linePath.areaPath}
            fill={areaColor}
            fillOpacity={0.25}
          />
        )}

        {/* Main line */}
        {linePath.linePath && (
          <Path
            d={linePath.linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {chartData.map((point, index) => {
          const x = chartPadding + ((point.timestamp - startTime) / timeRange) * availableWidth;
          const y = chartPadding + availableHeight - ((point.value - yMin) / valueRange) * availableHeight;
          return (
            <Circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r={2}
              fill={lineColor}
              opacity={0.6}
            />
          );
        })}

        {/* X-axis labels */}
        {timeLabels.map((label, index) => (
          <SvgText
            key={`x-label-${index}`}
            x={label.x}
            y={chartPadding + availableHeight + 20}
            fill="rgba(255,255,255,0.6)"
            fontSize="10"
            textAnchor="middle"
          >
            {label.label}
          </SvgText>
        ))}

        {/* Axes */}
        <Line
          x1={chartPadding}
          y1={chartPadding}
          x2={chartPadding}
          y2={chartPadding + availableHeight}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <Line
          x1={chartPadding}
          y1={chartPadding + availableHeight}
          x2={chartPadding + availableWidth}
          y2={chartPadding + availableHeight}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'visible',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
});
