import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RNSvg = require('react-native-svg');

const { width } = Dimensions.get('window');

// Mock data - replace with real API data
const MOCK_RESPIRATION_DATA = {
  min: 14,
  average: 18,
  max: 21,
  healthyRangeMin: 10,
  healthyRangeMax: 22,
  outOfRangeMinutes: 0,
  lastSync: '8:52pm',
  hourlyData: [
    { time: '2am', rpm: 17 },
    { time: '3am', rpm: 19 },
    { time: '3:30am', rpm: 21 },
    { time: '4am', rpm: 18 },
    { time: '4:30am', rpm: 16 },
    { time: '5am', rpm: 19 },
    { time: '5:30am', rpm: 20 },
    { time: '6am', rpm: 17 },
    { time: '6:30am', rpm: null }, // Gap in data
    { time: '7am', rpm: 16 },
    { time: '8am', rpm: 18 },
    { time: '9am', rpm: 16 },
    { time: '9:30am', rpm: 14 },
    { time: '10am', rpm: 16 },
  ],
};

export default function RespirationInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = React.useState<'Day' | 'Week' | 'Month'>('Day');
  const [selectedDate, setSelectedDate] = React.useState(new Date()); // Start with today's date

  // Get start of week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get end of week (Sunday)
  const getWeekEnd = (date: Date): Date => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return weekEnd;
  };

  // Format date for display based on period
  const formattedDate = React.useMemo(() => {
    if (selectedPeriod === 'Day') {
      return selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } else if (selectedPeriod === 'Week') {
      const weekStart = getWeekStart(selectedDate);
      const weekEnd = getWeekEnd(selectedDate);
      const startStr = weekStart.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      const endStr = weekEnd.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } else {
      // Month
      return selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }
  }, [selectedDate, selectedPeriod]);

  // Navigate to previous period (Day/Week/Month)
  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === 'Day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (selectedPeriod === 'Week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      // Month
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  // Navigate to next period (Day/Week/Month)
  const goToNext = () => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === 'Day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (selectedPeriod === 'Week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      // Month
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // Reset to today when period changes
  React.useEffect(() => {
    setSelectedDate(new Date());
  }, [selectedPeriod]);

  // Chart dimensions
  const chartWidth = width - 64;
  const chartHeight = 280;
  const chartPadding = 40;
  const availableWidth = chartWidth - chartPadding * 2;
  const availableHeight = chartHeight - chartPadding * 2 - 30; // 30 for labels
  const minRPM = 4;
  const maxRPM = 26;

  // Prepare chart data for line graph
  const chartData = React.useMemo(() => {
    const allData = MOCK_RESPIRATION_DATA.hourlyData;
    const validData = allData.filter((d) => d.rpm !== null);
    
    // Calculate positions for all data points (including gaps)
    const dataPoints = allData.map((d, index) => {
      if (d.rpm !== null) {
        // Find position in valid data array
        const validIndex = allData.slice(0, index + 1).filter((item) => item.rpm !== null).length - 1;
        const x = chartPadding + (validIndex / (validData.length - 1 || 1)) * availableWidth;
        const y = chartPadding + availableHeight - ((d.rpm - minRPM) / (maxRPM - minRPM)) * availableHeight;
        return { x, y, rpm: d.rpm, time: d.time, hasData: true };
      }
      // For gaps, estimate position based on index
      const estimatedX = chartPadding + (index / (allData.length - 1 || 1)) * availableWidth;
      return { x: estimatedX, y: 0, rpm: null, time: d.time, hasData: false };
    });
    
    return {
      points: validData.map((d, index) => {
        const x = chartPadding + (index / (validData.length - 1 || 1)) * availableWidth;
        const y = chartPadding + availableHeight - ((d.rpm! - minRPM) / (maxRPM - minRPM)) * availableHeight;
        return { x, y, rpm: d.rpm!, time: d.time };
      }),
      allLabels: allData.map((d) => d.time),
      labelPositions: dataPoints.map((p) => p.x),
    };
  }, []);

  // Build path for respiration line
  const respirationPath = React.useMemo(() => {
    if (chartData.points.length === 0) return '';
    let path = `M ${chartData.points[0].x} ${chartData.points[0].y}`;
    for (let i = 1; i < chartData.points.length; i++) {
      path += ` L ${chartData.points[i].x} ${chartData.points[i].y}`;
    }
    return path;
  }, [chartData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#02041A" />
      <LinearGradient 
        colors={['#1D244D', '#02041A', '#1A1D3E']} 
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More Insights</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Tabs */}
        <View style={styles.periodContainer}>
          {(['Day', 'Week', 'Month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodTab, selectedPeriod === period && styles.periodTabActive]}
              onPress={() => setSelectedPeriod(period)}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodTabText, selectedPeriod === period && styles.periodTabTextActive]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={goToPrevious} style={styles.dateNavButton} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#C7D6FF" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <TouchableOpacity onPress={goToNext} style={styles.dateNavButton} activeOpacity={0.8}>
            <Ionicons name="chevron-forward" size={20} color="#C7D6FF" />
          </TouchableOpacity>
        </View>

        {/* Key Respiration Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Min</Text>
            <Text style={styles.metricValue}>{MOCK_RESPIRATION_DATA.min}</Text>
            <Text style={styles.metricUnit}>RPM</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average</Text>
            <Text style={styles.metricValue}>{MOCK_RESPIRATION_DATA.average}</Text>
            <Text style={styles.metricUnit}>RPM</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Max</Text>
            <Text style={styles.metricValue}>{MOCK_RESPIRATION_DATA.max}</Text>
            <Text style={styles.metricUnit}>RPM</Text>
          </View>
        </View>

        {/* Healthy Range Information */}
        <View style={styles.healthyRangeContainer}>
          <View style={styles.healthyRangeRow}>
            <Text style={styles.healthyRangeText}>Out of your healthy range</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Ionicons name="help-circle-outline" size={16} color="#7EA6FF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.outOfRangeMinutes}>{MOCK_RESPIRATION_DATA.outOfRangeMinutes} Minutes</Text>
        </View>

        {/* Last Sync Time */}
        <View style={styles.lastSyncContainer}>
          <Text style={styles.lastSyncText}>Last sync: {MOCK_RESPIRATION_DATA.lastSync}</Text>
        </View>

        {/* Respiration Graph */}
        <View style={styles.chartContainer}>
          {/* Healthy Range Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendRectangle, { backgroundColor: 'rgba(126,166,255,0.3)' }]} />
              <Text style={styles.legendText}>Your healthy range</Text>
            </View>
          </View>

          <RNSvg.Svg width={chartWidth} height={chartHeight}>
            {/* Y-axis labels (every 2 RPM: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26) */}
            {[4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26].map((rpm) => {
              const y = chartPadding + availableHeight - ((rpm - minRPM) / (maxRPM - minRPM)) * availableHeight;
              return (
                <RNSvg.Text
                  key={`y-label-${rpm}`}
                  x={chartPadding - 10}
                  y={y + 4}
                  fill="rgba(255,255,255,0.7)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {rpm}
                </RNSvg.Text>
              );
            })}

            {/* Y-axis label */}
            <RNSvg.Text
              x={15}
              y={chartPadding + availableHeight / 2}
              fill="rgba(255,255,255,0.7)"
              fontSize="10"
              textAnchor="middle"
              transform={`rotate(-90, 15, ${chartPadding + availableHeight / 2})`}
            >
              RPM
            </RNSvg.Text>

            {/* Healthy range indicator (shaded area) */}
            <RNSvg.Rect
              x={chartPadding}
              y={chartPadding + availableHeight - ((MOCK_RESPIRATION_DATA.healthyRangeMax - minRPM) / (maxRPM - minRPM)) * availableHeight}
              width={availableWidth}
              height={((MOCK_RESPIRATION_DATA.healthyRangeMax - MOCK_RESPIRATION_DATA.healthyRangeMin) / (maxRPM - minRPM)) * availableHeight}
              fill="rgba(126,166,255,0.15)"
            />

            {/* Grid lines */}
            {[4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26].map((rpm) => {
              const y = chartPadding + availableHeight - ((rpm - minRPM) / (maxRPM - minRPM)) * availableHeight;
              return (
                <RNSvg.Line
                  key={`grid-${rpm}`}
                  x1={chartPadding}
                  y1={y}
                  x2={chartPadding + availableWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
              );
            })}

            {/* Respiration line */}
            {respirationPath && (
              <RNSvg.Path
                d={respirationPath}
                fill="none"
                stroke="#4A90E2"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {chartData.points.map((point, index) => (
              <RNSvg.Circle
                key={`point-${index}`}
                cx={point.x}
                cy={point.y}
                r={3}
                fill="#4A90E2"
              />
            ))}
          </RNSvg.Svg>

          {/* Time labels - show only key hourly labels to avoid overlap */}
          <View style={styles.chartLabelsContainer}>
            {chartData.allLabels.map((label, index) => {
              // Only show full hour labels (2am, 3am, 4am, etc.) and first/last
              const isFullHour = !label.includes(':') || label === '2am' || label === '10am';
              if (!isFullHour && index !== 0 && index !== chartData.allLabels.length - 1) {
                return <View key={`label-${index}`} style={styles.chartLabelWrapper} />;
              }
              
              return (
                <View key={`label-${index}`} style={styles.chartLabelWrapper}>
                  <Text style={styles.chartLabel} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02041A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: '#7EA6FF',
  },
  periodTabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '700',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  dateNavButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  metricUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  healthyRangeContainer: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  healthyRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  healthyRangeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  outOfRangeMinutes: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  lastSyncContainer: {
    marginBottom: 20,
  },
  lastSyncText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    paddingHorizontal: 40,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendRectangle: {
    width: 16,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
  },
  chartLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 40,
    minHeight: 30,
  },
  chartLabelWrapper: {
    alignItems: 'center',
    minWidth: 40,
  },
  chartLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});

