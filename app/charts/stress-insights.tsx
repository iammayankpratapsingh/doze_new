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
const MOCK_STRESS_DATA = {
  min: 30,
  average: 40,
  max: 49,
  averageStatus: 'Normal',
  lastSync: '09:55 PM',
  hourlyData: [
    { time: '12 AM', value: 35, label: '12 AM-1 AM' },
    { time: '1 AM', value: 32, label: '1 AM-2 AM' },
    { time: '2 AM', value: 38, label: '2 AM-3 AM' },
    { time: '3 AM', value: 34, label: '3 AM-4 AM' },
    { time: '4 AM', value: 36, label: '4 AM-5 AM' },
    { time: '5 AM', value: 33, label: '5 AM-6 AM' },
    { time: '6 AM', value: 37, label: '6 AM-7 AM' },
    { time: '7 AM', value: 39, label: '7 AM-8 AM' },
    { time: '8 AM', value: 42, label: '8 AM-9 AM' },
    { time: '9 AM', value: 41, label: '9 AM-10 AM' },
    { time: '10 AM', value: 43, label: '10 AM-11 AM' },
    { time: '11 AM', value: 45, label: '11 AM-12 PM' },
    { time: '12 PM', value: 44, label: '12 PM-1 PM' },
    { time: '1 PM', value: 46, label: '1 PM-2 PM' },
    { time: '2 PM', value: 32, label: '2 PM-3 PM', status: 'Normal' },
    { time: '3 PM', value: 38, label: '3 PM-4 PM' },
    { time: '4 PM', value: 40, label: '4 PM-5 PM' },
    { time: '5 PM', value: 42, label: '5 PM-6 PM' },
    { time: '6 PM', value: 41, label: '6 PM-7 PM' },
    { time: '7 PM', value: 39, label: '7 PM-8 PM' },
    { time: '8 PM', value: 37, label: '8 PM-9 PM' },
    { time: '9 PM', value: 35, label: '9 PM-10 PM' },
    { time: '10 PM', value: 33, label: '10 PM-11 PM' },
    { time: '11 PM', value: 31, label: '11 PM-12 AM' },
  ],
};

export default function StressInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = React.useState<'Day' | 'Week' | 'Month'>('Day');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedBarIndex, setSelectedBarIndex] = React.useState<number | null>(14); // 2 PM-3 PM

  // Get start of week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();
      if (isToday) {
        return 'Today';
      }
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
      return selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }
  }, [selectedDate, selectedPeriod]);

  // Navigate to previous period
  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === 'Day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (selectedPeriod === 'Week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  // Navigate to next period
  const goToNext = () => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === 'Day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (selectedPeriod === 'Week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
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
  const chartHeight = 300;
  const chartPadding = 50;
  const availableWidth = chartWidth - chartPadding * 2;
  const availableHeight = chartHeight - chartPadding * 2 - 40;
  const minValue = 0;
  const maxValue = 100;

  // Filter data for display (show key times: 12 AM, 4 AM, 8 AM, 12 PM, 4 PM, 8 PM)
  const displayData = React.useMemo(() => {
    const keyTimes = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM'];
    return MOCK_STRESS_DATA.hourlyData.filter((d) => keyTimes.includes(d.time));
  }, []);

  // Prepare chart data for bar chart
  const chartData = React.useMemo(() => {
    return displayData.map((data, index) => {
      const barWidth = (availableWidth / displayData.length) * 0.6;
      const barSpacing = (availableWidth / displayData.length) * 0.4;
      const barX = chartPadding + index * (barWidth + barSpacing) + barSpacing / 2;
      const barHeight = (data.value / maxValue) * availableHeight;
      const barY = chartPadding + availableHeight - barHeight;

      return {
        x: barX,
        y: barY,
        width: barWidth,
        height: barHeight,
        value: data.value,
        label: data.label,
        time: data.time,
        status: data.status || 'Normal',
      };
    });
  }, []);

  const selectedBar = selectedBarIndex !== null ? chartData[selectedBarIndex] : null;

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
                {period === 'Day' ? 'Days' : period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={goToPrevious} style={styles.dateNavButton} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#C7D6FF" />
          </TouchableOpacity>
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            {formattedDate === 'Today' && (
              <Ionicons name="chevron-down" size={16} color="#C7D6FF" style={{ marginLeft: 4 }} />
            )}
          </View>
          <TouchableOpacity onPress={goToNext} style={styles.dateNavButton} activeOpacity={0.8}>
            <Ionicons name="chevron-forward" size={20} color="#C7D6FF" />
          </TouchableOpacity>
        </View>

        {/* Stress Level Summary Card */}
        <View style={styles.stressCard}>
          {/* Share Icon */}
          <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Central Brain Icon */}
          <View style={styles.centralIconContainer}>
            <View style={styles.brainIcon}>
              <Ionicons name="brain" size={48} color="#7EA6FF" />
            </View>
          </View>

          {/* Stress Level Title */}
          <View style={styles.stressTitleRow}>
            <Text style={styles.stressTitle}>Stress level</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoText}>i</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Last Sync */}
          <Text style={styles.lastSyncText}>Last sync today, {MOCK_STRESS_DATA.lastSync}</Text>

          {/* Min, Average, Max Metrics */}
          <View style={styles.metricsContainer}>
            {/* Min */}
            <View style={styles.metricItem}>
              <Ionicons name="brain-outline" size={20} color="#7EA6FF" />
              <Text style={styles.metricValue}>{MOCK_STRESS_DATA.min}</Text>
              <Text style={styles.metricLabel}>Min</Text>
            </View>

            {/* Average (Center, Larger) */}
            <View style={styles.metricItemCenter}>
              <Text style={styles.metricValueCenter}>{MOCK_STRESS_DATA.average}</Text>
              <Text style={styles.metricStatus}>{MOCK_STRESS_DATA.averageStatus}</Text>
              <Text style={styles.metricLabelCenter}>Avg. Stress Level</Text>
            </View>

            {/* Max */}
            <View style={styles.metricItem}>
              <Ionicons name="brain-outline" size={20} color="#7EA6FF" />
              <Text style={styles.metricValue}>{MOCK_STRESS_DATA.max}</Text>
              <Text style={styles.metricLabel}>Max</Text>
            </View>
          </View>
        </View>

        {/* Stress Level Graph */}
        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <RNSvg.Svg width={chartWidth} height={chartHeight}>
            {/* Y-axis labels (0, 20, 40, 60, 80, 100) */}
            {[0, 20, 40, 60, 80, 100].map((value) => {
              const y = chartPadding + availableHeight - ((value - minValue) / (maxValue - minValue)) * availableHeight;
              return (
                <RNSvg.Text
                  key={`y-label-${value}`}
                  x={chartPadding - 10}
                  y={y + 4}
                  fill="rgba(255,255,255,0.7)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {value}
                </RNSvg.Text>
              );
            })}

            {/* Grid lines */}
            {[0, 20, 40, 60, 80, 100].map((value) => {
              const y = chartPadding + availableHeight - ((value - minValue) / (maxValue - minValue)) * availableHeight;
              return (
                <RNSvg.Line
                  key={`grid-${value}`}
                  x1={chartPadding}
                  y1={y}
                  x2={chartPadding + availableWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
              );
            })}

            {/* Bars */}
            {chartData.map((bar, index) => {
              const isSelected = selectedBarIndex === index;
              return (
                <React.Fragment key={`bar-${index}`}>
                  <RNSvg.Rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    fill={isSelected ? '#5FD4B0' : '#7EE3A1'}
                    rx={4}
                    ry={4}
                  />
                  {isSelected && (
                    <RNSvg.Circle
                      cx={bar.x + bar.width / 2}
                      cy={bar.y}
                      r={4}
                      fill="#FFFFFF"
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Tooltip for selected bar */}
            {selectedBar && (
              <React.Fragment>
                <RNSvg.Rect
                  x={selectedBar.x + selectedBar.width / 2 - 60}
                  y={selectedBar.y - 50}
                  width={120}
                  height={40}
                  fill="rgba(15,17,43,0.95)"
                  rx={8}
                  ry={8}
                />
                <RNSvg.Text
                  x={selectedBar.x + selectedBar.width / 2}
                  y={selectedBar.y - 30}
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {selectedBar.label}
                </RNSvg.Text>
                <RNSvg.Text
                  x={selectedBar.x + selectedBar.width / 2}
                  y={selectedBar.y - 15}
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {selectedBar.value} {selectedBar.status}
                </RNSvg.Text>
              </React.Fragment>
            )}
          </RNSvg.Svg>

          {/* Touchable overlay for bar selection */}
          <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none' }]}>
            {chartData.map((bar, index) => (
              <TouchableOpacity
                key={`touch-${index}`}
                activeOpacity={0.8}
                onPress={() => setSelectedBarIndex(index)}
                style={{
                  position: 'absolute',
                  left: bar.x,
                  top: bar.y,
                  width: bar.width,
                  height: bar.height,
                }}
              />
            ))}
          </View>
          </View>

          {/* Time labels */}
          <View style={styles.chartLabelsContainer}>
            {displayData.map((data, index) => (
              <View key={`label-${index}`} style={styles.chartLabelWrapper}>
                <Text style={styles.chartLabel} numberOfLines={1}>
                  {data.time}
                </Text>
              </View>
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
  dateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  stressCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    position: 'relative',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralIconContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  brainIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(126,166,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stressTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  lastSyncText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 24,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'flex-end',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricItemCenter: {
    flex: 1.2,
    alignItems: 'center',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  metricValueCenter: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
  },
  metricStatus: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  metricLabelCenter: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
  chartWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  chartLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 50,
    minHeight: 30,
  },
  chartLabelWrapper: {
    alignItems: 'center',
    minWidth: 50,
  },
  chartLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

