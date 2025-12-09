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
const { Rect } = RNSvg as { Rect: any };

const { width } = Dimensions.get('window');

// Mock data - replace with real API data
const MOCK_SLEEP_DATA = {
  sleepTime: '02:26am',
  duration: '7H 12M',
  wakeupTime: '09:58am',
  timeToSleep: '20Minutes',
  snoring: 'Heavy',
  restlessness: 'High',
  stages: {
    awake: 12, // minutes
    rem: 74,
    light: 286,
    deep: 71,
  },
  hourlyData: [
    { time: '2am', awake: 0, rem: 0, light: 0, deep: 0 },
    { time: '3am', awake: 5, rem: 15, light: 35, deep: 5 },
    { time: '4am', awake: 2, rem: 20, light: 30, deep: 8 },
    { time: '5am', awake: 1, rem: 18, light: 35, deep: 6 },
    { time: '6am', awake: 3, rem: 12, light: 40, deep: 5 },
    { time: '7am', awake: 1, rem: 9, light: 45, deep: 5 },
    { time: '8am', awake: 0, rem: 0, light: 50, deep: 10 },
    { time: '9am', awake: 0, rem: 0, light: 55, deep: 5 },
    { time: '10am', awake: 0, rem: 0, light: 0, deep: 0 },
  ],
};

export default function SleepInsightsScreen() {
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
  const chartHeight = 220;
  const barWidth = 32;
  const barSpacing = 8;
  const maxValue = 60; // Maximum minutes per hour
  const chartPadding = 20;
  const availableWidth = chartWidth - chartPadding * 2;
  const availableHeight = chartHeight - chartPadding * 2 - 20; // 20 for labels

  // Prepare chart data with stacked bars for each sleep stage
  const chartData = React.useMemo(() => {
    return MOCK_SLEEP_DATA.hourlyData.map((hour, index) => {
      const total = hour.awake + hour.rem + hour.light + hour.deep;
      
      // Calculate positions
      const barX = chartPadding + index * (barWidth + barSpacing);
      const barBaseY = chartPadding + availableHeight;
      
      // Stack order: Deep (bottom), Light, REM, Awake (top)
      // Calculate Y positions for each stack segment from bottom to top
      let currentY = barBaseY;
      const stacks = [
        { value: hour.deep, color: '#1B3A57', y: 0, height: 0 },      // Dark Blue - Deep (bottom)
        { value: hour.light, color: '#4A90E2', y: 0, height: 0 },     // Medium Blue - Light
        { value: hour.rem, color: '#7EA6FF', y: 0, height: 0 },       // Light Blue - REM
        { value: hour.awake, color: '#FFA76B', y: 0, height: 0 },     // Orange - Awake (top)
      ];
      
      // Calculate Y positions and heights from bottom to top
      stacks.forEach((stack) => {
        stack.height = (stack.value / maxValue) * availableHeight;
        stack.y = currentY - stack.height;
        currentY = stack.y;
      });
      
      return {
        x: barX,
        label: hour.time,
        total,
        stacks,
      };
    });
  }, []);

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

        {/* Key Sleep Metrics Grid - 2 rows x 3 columns */}
        <View style={styles.metricsGrid}>
          {/* Row 1 - 3 columns */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Sleep Time</Text>
              <Text style={styles.metricValue}>{MOCK_SLEEP_DATA.sleepTime}</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricLabelRow}>
                <Text style={styles.metricLabel}>Duration</Text>
                <TouchableOpacity activeOpacity={0.6}>
                  <Ionicons name="help-circle-outline" size={16} color="#7EA6FF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.metricValue}>{MOCK_SLEEP_DATA.duration}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Wakeup Time</Text>
              <Text style={styles.metricValue}>{MOCK_SLEEP_DATA.wakeupTime}</Text>
            </View>
          </View>

          {/* Row 2 - 3 columns */}
          <View style={[styles.metricsRow, { marginBottom: 0 }]}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Time to Sleep</Text>
              <Text style={styles.metricValue}>{MOCK_SLEEP_DATA.timeToSleep}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Snoring</Text>
              <Text style={styles.metricValue}>{MOCK_SLEEP_DATA.snoring}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Restlessness</Text>
              <Text style={styles.metricValue}>{MOCK_SLEEP_DATA.restlessness}</Text>
            </View>
          </View>
        </View>

        {/* Sleep Stage Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFA76B' }]} />
            <Text style={styles.legendText}>Awake: {MOCK_SLEEP_DATA.stages.awake}min</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#7EA6FF' }]} />
            <Text style={styles.legendText}>REM: {MOCK_SLEEP_DATA.stages.rem}min</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4A90E2' }]} />
            <Text style={styles.legendText}>Light: {MOCK_SLEEP_DATA.stages.light}min</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1B3A57' }]} />
            <Text style={styles.legendText}>Deep: {MOCK_SLEEP_DATA.stages.deep}min</Text>
          </View>
        </View>

        {/* Sleep Stage Graph */}
        <View style={styles.chartContainer}>
          <RNSvg.Svg width={chartWidth} height={chartHeight}>
            {/* Grid lines for each hour */}
            {chartData.map((bar, index) => {
              const gridX = bar.x + barWidth / 2;
              return (
                <Rect
                  key={`grid-${index}`}
                  x={gridX}
                  y={chartPadding}
                  width={1}
                  height={availableHeight}
                  fill="rgba(255,255,255,0.08)"
                />
              );
            })}
            
            {/* Stacked bars */}
            {chartData.map((bar, barIndex) => (
              <React.Fragment key={`bar-${barIndex}`}>
                {bar.stacks.map((stack, stackIndex) => {
                  if (stack.value === 0) return null; // Skip empty stacks
                  return (
                    <Rect
                      key={`stack-${barIndex}-${stackIndex}`}
                      x={bar.x}
                      y={stack.y}
                      width={barWidth}
                      height={stack.height}
                      fill={stack.color}
                      rx={4}
                      ry={4}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </RNSvg.Svg>
          
          {/* Time labels */}
          <View style={styles.chartLabelsContainer}>
            {chartData.map((bar, index) => (
              <Text key={`label-${index}`} style={styles.chartLabel}>
                {bar.label}
              </Text>
            ))}
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
  metricsGrid: {
    marginBottom: 32,
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginTop: 8,
    marginBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
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
  chartLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  chartLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
});



