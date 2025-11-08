import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Rect,
  Text as SvgText,
  TSpan,
  Line,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import DatabaseService from '../services/DatabaseService';

const { width, height } = Dimensions.get('window');
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 200;

const StatsScreen = () => {
  const { currentIntake, dailyGoal, stats } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);
  const translateX = useRef(new Animated.Value(0)).current;

  // Real data states
  const [hourlyData, setHourlyData] = useState(new Array(24).fill(0));
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [streak, setStreak] = useState(0);

  const tabs = ['Daily', 'Weekly', 'Monthly'];

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    console.log('📊 StatsScreen: Loading stats data...');
    setLoading(true);
    try {
      // Load hourly data for today
      console.log('📊 StatsScreen: Fetching hourly data...');
      const hourly = await DatabaseService.getHourlyIntake();
      console.log('📊 StatsScreen: Hourly data received:', hourly.length, 'records');
      setHourlyData(hourly);

      // Load weekly data (last 7 days)
      console.log('📊 StatsScreen: Fetching weekly data...');
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);

      const weekStartStr = weekStart.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const weeklyResults = await DatabaseService.getWeeklyIntake(weekStartStr, todayStr);
      console.log('📊 StatsScreen: Weekly data received:', weeklyResults.length, 'records');

      // Fill in missing days with 0
      const weeklyDataFormatted = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const existingData = weeklyResults.find(r => r.date === dateStr);
        weeklyDataFormatted.push({
          date: dateStr,
          consumed: existingData ? existingData.consumed : 0,
          goal: dailyGoal,
          dayName: dayNames[date.getDay()],
        });
      }
      setWeeklyData(weeklyDataFormatted);
      console.log('📊 StatsScreen: Weekly data formatted:', weeklyDataFormatted.length, 'days');

      // Load monthly data
      console.log('📊 StatsScreen: Fetching monthly data...');
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const monthlyResults = await DatabaseService.getMonthlyIntake(year, month);
      console.log('📊 StatsScreen: Monthly data received:', monthlyResults.length, 'records');

      // Fill in missing days
      const daysInMonth = new Date(year, month, 0).getDate();
      const monthlyDataFormatted = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const existingData = monthlyResults.find(r => r.day === i);
        monthlyDataFormatted.push({
          date: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
          consumed: existingData ? existingData.consumed : 0,
          day: i,
        });
      }
      setMonthlyData(monthlyDataFormatted);
      console.log('📊 StatsScreen: Monthly data formatted:', monthlyDataFormatted.length, 'days');

      // Load streak
      console.log('📊 StatsScreen: Fetching streak data...');
      const streakDays = await DatabaseService.getStreakDays();
      console.log('📊 StatsScreen: Streak data received:', streakDays, 'days');
      setStreak(streakDays);

      console.log('✅ StatsScreen: All data loaded successfully');
    } catch (error) {
      console.error('❌ StatsScreen: Failed to load stats data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatsData();
    setRefreshing(false);
  };

  const switchTab = (index) => {
    setActiveTab(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  // Daily View Components
  const DailyCircularProgress = ({ consumed, goal }) => {
    const percentage = Math.min((consumed / goal) * 100, 100);
    const radius = 76.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const size = 193;
    const center = size / 2;

    return (
      <View style={styles.circularProgressContainer}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4A90E2" />
              <Stop offset="100%" stopColor="#87CEEB" />
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E8F4F8"
            strokeWidth={10}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={10}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Main number with ml */}
          <SvgText
            x={center}
            y={center - 20}
            textAnchor="middle"
            fontWeight="bold"
            fill="#4A90E2"
          >
            <TSpan fontSize={22}>{consumed}</TSpan>
            <TSpan fontSize={12} dx={-11} fill="#888">ml</TSpan>
          </SvgText>
          {/* "of" text */}
          <SvgText
            x={center}
            y={center + 5}
            textAnchor="middle"
            fontSize={12}
            fill="#888"
          >
            of
          </SvgText>
          {/* Goal amount with ml */}
          <SvgText
            x={center}
            y={center + 35}
            textAnchor="middle"
            fontWeight="bold"
            fill="#666"
          >
            <TSpan fontSize={22}>{goal}</TSpan>
            <TSpan fontSize={12} dx={-11} fill="#888">ml</TSpan>
          </SvgText>
        </Svg>
      </View>
    );
  };

  const HourlyBars = ({ hourlyData }) => {
    const maxValue = Math.max(...hourlyData, 1);
    const barWidth = (CHART_WIDTH - 60) / 24;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Hourly Consumption</Text>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {hourlyData.map((value, index) => {
            const barHeight = (value / maxValue) * (CHART_HEIGHT - 60);
            return (
              <G key={index}>
                <Rect
                  x={30 + index * barWidth + 2}
                  y={CHART_HEIGHT - 30 - barHeight}
                  width={barWidth - 4}
                  height={barHeight}
                  fill={value > 0 ? "#4A90E2" : "#E8F4F8"}
                  rx={2}
                />
                {index % 4 === 0 && (
                  <SvgText
                    x={30 + index * barWidth + barWidth / 2}
                    y={CHART_HEIGHT - 10}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#666"
                  >
                    {index}h
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Weekly View Components
  const WeeklyBarChart = ({ weeklyData }) => {
    const maxValue = Math.max(...weeklyData.map(d => Math.max(d.consumed, d.goal)));
    const barWidth = (CHART_WIDTH - 80) / 14; // Space for 7 days with goals

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Progress</Text>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {weeklyData.map((day, index) => {
            const consumedHeight = (day.consumed / maxValue) * (CHART_HEIGHT - 60);
            const goalHeight = (day.goal / maxValue) * (CHART_HEIGHT - 60);
            const xPos = 40 + index * barWidth * 2;

            return (
              <G key={index}>
                {/* Goal bar (background) */}
                <Rect
                  x={xPos}
                  y={CHART_HEIGHT - 30 - goalHeight}
                  width={barWidth - 2}
                  height={goalHeight}
                  fill="#E8F4F8"
                  rx={2}
                />
                {/* Consumed bar */}
                <Rect
                  x={xPos}
                  y={CHART_HEIGHT - 30 - consumedHeight}
                  width={barWidth - 2}
                  height={consumedHeight}
                  fill={day.consumed >= day.goal ? "#4CAF50" : "#4A90E2"}
                  rx={2}
                />
                {/* Day label */}
                <SvgText
                  x={xPos + barWidth / 2}
                  y={CHART_HEIGHT - 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#666"
                >
                  {day.dayName}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Monthly View Components
  const MonthlyHeatMap = ({ monthlyData }) => {
    const maxValue = Math.max(...monthlyData.map(d => d.consumed));
    const minValue = Math.min(...monthlyData.map(d => d.consumed));
    const cellSize = (CHART_WIDTH - 60) / 7;
    const weeks = Math.ceil(monthlyData.length / 7);

    const getIntensity = (value) => {
      // Handle case when all values are 0 or equal
      if (maxValue === minValue) {
        return value > 0 ? 0.5 : 0.2;
      }
      const normalized = (value - minValue) / (maxValue - minValue);
      return Math.max(0.2, normalized);
    };

    const getColor = (intensity) => {
      const opacity = isNaN(intensity) ? 0.2 : intensity;
      return `rgba(74, 144, 226, ${opacity})`;
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Heat Map</Text>
        <Svg width={CHART_WIDTH} height={weeks * cellSize + 40}>
          {monthlyData.map((day, index) => {
            const row = Math.floor(index / 7);
            const col = index % 7;
            const intensity = getIntensity(day.consumed);

            return (
              <G key={index}>
                <Rect
                  x={30 + col * cellSize + 2}
                  y={20 + row * cellSize + 2}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  fill={getColor(intensity)}
                  rx={4}
                />
                <SvgText
                  x={30 + col * cellSize + cellSize / 2}
                  y={20 + row * cellSize + cellSize / 2 + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#fff"
                  fontWeight="bold"
                >
                  {day.day}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  const StatCard = ({ title, value, subtitle, icon, color = "#4A90E2" }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderDailyView = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <DailyCircularProgress
        consumed={currentIntake}
        goal={dailyGoal}
      />

      <View style={styles.statsRow}>
        <StatCard
          title="Streak"
          value={`${streak} days`}
          icon="flame"
          color="#FF6B35"
        />
        <StatCard
          title="Progress"
          value={`${Math.round((currentIntake / dailyGoal) * 100)}%`}
          icon="trending-up"
          color="#4CAF50"
        />
      </View>

      <HourlyBars hourlyData={hourlyData} />
    </ScrollView>
  );

  const renderWeeklyView = () => {
    const weeklyAverage = weeklyData.length > 0
      ? Math.round(weeklyData.reduce((sum, day) => sum + day.consumed, 0) / weeklyData.length)
      : 0;
    const goalsMet = weeklyData.filter(day => day.consumed >= day.goal).length;

    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <StatCard
            title="Weekly Average"
            value={`${weeklyAverage}ml`}
            icon="analytics"
            color="#4A90E2"
          />
          <StatCard
            title="Goals Met"
            value={`${goalsMet}/7`}
            subtitle="days"
            icon="checkmark-circle"
            color="#4CAF50"
          />
        </View>

        <WeeklyBarChart weeklyData={weeklyData} />

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Goal Met</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4A90E2' }]} />
            <Text style={styles.legendText}>In Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#E8F4F8' }]} />
            <Text style={styles.legendText}>Goal Target</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderMonthlyView = () => {
    const monthlyTotal = monthlyData.reduce((sum, day) => sum + day.consumed, 0);
    const monthlyAverage = monthlyData.length > 0
      ? Math.round(monthlyTotal / monthlyData.length)
      : 0;
    const bestDay = monthlyData.length > 0
      ? monthlyData.reduce((max, day) => day.consumed > max.consumed ? day : max)
      : { consumed: 0, day: 0 };
    const worstDay = monthlyData.length > 0
      ? monthlyData.reduce((min, day) => day.consumed < min.consumed ? day : min)
      : { consumed: 0, day: 0 };

    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <StatCard
            title="Monthly Total"
            value={`${(monthlyTotal / 1000).toFixed(1)}L`}
            icon="water"
            color="#4A90E2"
          />
          <StatCard
            title="Daily Average"
            value={`${monthlyAverage}ml`}
            icon="analytics"
            color="#87CEEB"
          />
        </View>

        <MonthlyHeatMap monthlyData={monthlyData} />

        <View style={styles.statsRow}>
          <StatCard
            title="Best Day"
            value={`${bestDay.consumed}ml`}
            subtitle={`Day ${bestDay.day}`}
            icon="trophy"
            color="#4CAF50"
          />
          <StatCard
            title="Lowest Day"
            value={`${worstDay.consumed}ml`}
            subtitle={`Day ${worstDay.day}`}
            icon="alert-circle"
            color="#FF6B35"
          />
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
        <View style={styles.tabContainer}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === index && styles.activeTab]}
              onPress={() => switchTab(index)}
            >
              <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveTab(newIndex);
        }}
      >
        <View style={styles.page}>
          {renderDailyView()}
        </View>
        <View style={styles.page}>
          {renderWeeklyView()}
        </View>
        <View style={styles.page}>
          {renderMonthlyView()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFE',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4F8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  page: {
    width: width,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  circularProgressContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default StatsScreen;