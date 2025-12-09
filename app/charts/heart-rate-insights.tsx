import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HealthGraph, HealthDataPoint, ZOOM_LEVELS } from '../../components/HealthGraph';
import { useDevice } from '@/contexts/DeviceContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceHistory } from '@/services/deviceData';

// Mock data - replace with real API data
const MOCK_HEART_RATE_DATA = {
  min: 55,
  average: 61,
  max: 74,
  healthyRangeMin: 40,
  healthyRangeMax: 80,
  outOfRangeMinutes: 0,
  lastSync: '8:52pm',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HeartRateInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeDevice } = useDevice();
  const { auth } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = React.useState<'Day' | 'Week' | 'Month'>('Day');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Heart rate data - fetched from API
  const [heartRateData, setHeartRateData] = React.useState<HealthDataPoint[]>([]);
  
  // Fetch heart rate data for last 15 minutes
  const fetchHeartRateData = React.useCallback(async () => {
    if (!activeDevice?.deviceId || !auth.isLoggedIn) {
      return;
    }

    try {
      setIsLoading(true);
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000); // Last 15 minutes
      
      const result = await getDeviceHistory(activeDevice.deviceId, {
        from: fifteenMinutesAgo,
        to: now,
        limit: 200, // Get enough points for 15 minutes (every 6 seconds = ~150 points)
      });

      if (result.success && result.data && Array.isArray(result.data)) {
        // Transform API data to HealthDataPoint format
        const dataPoints: HealthDataPoint[] = result.data
          .filter((item: any) => {
            const hr = item.heartRate || item.hr;
            return hr && hr > 0 && item.timestamp;
          })
          .map((item: any) => {
            const timestamp = new Date(item.timestamp);
            return {
              timestamp: isNaN(timestamp.getTime()) ? Date.now() : timestamp.getTime(), // Convert to milliseconds
              value: item.heartRate || item.hr || 0,
            };
          })
          .filter((point: HealthDataPoint) => point.value > 0) // Final filter
          .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

        setHeartRateData(dataPoints);
      } else {
        setHeartRateData([]);
      }
    } catch (error) {
      console.error('Failed to fetch heart rate data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeDevice?.deviceId, auth.isLoggedIn]);

  // Fetch data on mount and when period/date changes
  React.useEffect(() => {
    fetchHeartRateData();
    
    // Refresh every 6 seconds to get latest data
    const interval = setInterval(() => {
      fetchHeartRateData();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchHeartRateData, selectedPeriod, selectedDate]);
  
  // Calculate metrics from data
  const metrics = React.useMemo(() => {
    if (heartRateData.length === 0) {
      return { 
        min: MOCK_HEART_RATE_DATA.min, 
        average: MOCK_HEART_RATE_DATA.average, 
        max: MOCK_HEART_RATE_DATA.max 
      };
    }
    const values = heartRateData.map((d) => d.value).filter((v) => !isNaN(v) && isFinite(v) && v > 0);
    if (values.length === 0) {
      return { 
        min: MOCK_HEART_RATE_DATA.min, 
        average: MOCK_HEART_RATE_DATA.average, 
        max: MOCK_HEART_RATE_DATA.max 
      };
    }
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      average: Math.round(values.reduce((sum, val) => sum + val, 0) / values.length),
    };
  }, [heartRateData]);

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
  
  // Handle zoom change callback
  const handleZoomChange = React.useCallback((zoomLevel: typeof ZOOM_LEVELS[0], domain: { x: [number, number] }) => {
    // You can add logic here to update UI based on zoom level
    console.log('Zoom level changed:', zoomLevel.name, 'Domain:', domain);
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

        {/* Key Heart Rate Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Min</Text>
            <Text style={styles.metricValue}>{metrics.min}</Text>
            <Text style={styles.metricUnit}>BPM</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average</Text>
            <Text style={styles.metricValue}>{metrics.average}</Text>
            <Text style={styles.metricUnit}>BPM</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Max</Text>
            <Text style={styles.metricValue}>{metrics.max}</Text>
            <Text style={styles.metricUnit}>BPM</Text>
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
          <Text style={styles.outOfRangeMinutes}>
            {heartRateData.length > 0
              ? Math.round(
                  heartRateData.filter(
                    (d) => d.value < MOCK_HEART_RATE_DATA.healthyRangeMin || d.value > MOCK_HEART_RATE_DATA.healthyRangeMax
                  ).length * 6 // Each point is ~6 seconds
                )
              : 0}{' '}
            Seconds
          </Text>
        </View>

        {/* Last Sync Time */}
        <View style={styles.lastSyncContainer}>
          <Text style={styles.lastSyncText}>
            Last sync: {heartRateData.length > 0 
              ? new Date(heartRateData[heartRateData.length - 1].timestamp).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })
              : 'No data'}
          </Text>
        </View>

        {/* Heart Rate Graph - 15 minute view */}
        {isLoading && heartRateData.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7EA6FF" />
            <Text style={styles.loadingText}>Loading heart rate data...</Text>
          </View>
        ) : heartRateData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No heart rate data available</Text>
            <Text style={styles.emptySubtext}>Data will appear here when available</Text>
          </View>
        ) : heartRateData.length > 0 ? (
          <View style={styles.graphContainer}>
            <HealthGraph
              rawData={heartRateData}
              initialZoomLevel={0} // Start with 15-minute view (first zoom level)
              onZoomChange={handleZoomChange}
              height={280}
              yAxisLabel="BPM"
              lineColor="#FF6B6B"
              areaColor="rgba(255, 107, 107, 0.2)"
              minY={undefined} // Let graph calculate automatically
              maxY={undefined} // Let graph calculate automatically
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No heart rate data available</Text>
            <Text style={styles.emptySubtext}>Data will appear here when available</Text>
          </View>
        )}
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
  loadingContainer: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginTop: 10,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyContainer: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginTop: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  graphContainer: {
    width: SCREEN_WIDTH,
    marginLeft: -16, // Break out of scrollContent padding
    marginRight: -16,
    marginTop: 0,
    marginBottom: 0,
  },
});

