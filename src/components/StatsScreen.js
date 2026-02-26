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
  Path,
  Text as SvgText,
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

  const loadStatsData = async (isRefresh = false) => {
    console.log('📊 StatsScreen: Loading stats data...');
    if (!isRefresh) setLoading(true);
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
    await loadStatsData(true);
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
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
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
          </Svg>
          <View style={styles.circularProgressInner}>
            <View style={styles.circularProgressRow}>
              <Text style={styles.circularProgressNumber}>{consumed}</Text>
              <Text style={styles.circularProgressUnit}> ml</Text>
            </View>
            <Text style={styles.circularProgressOf}>of</Text>
            <View style={styles.circularProgressRow}>
              <Text style={styles.circularProgressGoalNumber}>{goal}</Text>
              <Text style={styles.circularProgressUnit}> ml</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const HourlyLineChart = ({ hourlyData }) => {
    // El eje Y va de 0 hasta el goal diario
    const chartMax = dailyGoal;
    const padL = 36, padR = 8, padT = 15, padB = 30;
    const svgW = CHART_WIDTH - 40; // descontar padding del chartContainer (20 cada lado)
    const innerW = svgW - padL - padR;
    const innerH = CHART_HEIGHT - padT - padB;

    const getX = (i) => +(padL + (i / 23) * innerW).toFixed(1);
    const getY = (v) => +(padT + innerH - (Math.min(v, chartMax) / chartMax) * innerH).toFixed(1);

    const linePath = hourlyData
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(v)}`)
      .join(' ');

    const baseY = padT + innerH;
    const fillPath = `${linePath} L${getX(23)},${baseY} L${getX(0)},${baseY} Z`;

    // Ticks cada 500ml desde 0 hasta el goal
    const yTicks = [];
    for (let v = 0; v <= chartMax; v += 500) {
      yTicks.push({ value: v, y: getY(v) });
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Hourly Consumption</Text>
        <Svg width={svgW} height={CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id="hourlyFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#4A90E2" stopOpacity={0.28} />
              <Stop offset="100%" stopColor="#4A90E2" stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>

          {/* Grid lines + labels eje Y */}
          {yTicks.map((tick) => {
            const isGoal = tick.value === chartMax;
            return (
              <G key={tick.value}>
                <Path
                  d={`M${padL},${tick.y} L${padL + innerW},${tick.y}`}
                  stroke={isGoal ? "#BDD8F5" : "#EEF6FC"}
                  strokeWidth={isGoal ? 1.5 : 1}
                  strokeDasharray={isGoal ? "4,3" : undefined}
                />
                <SvgText
                  x={padL - 4}
                  y={tick.y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill={isGoal ? "#4A90E2" : "#AAA"}
                  fontWeight={isGoal ? "bold" : "normal"}
                >
                  {tick.value === chartMax ? `${tick.value}` : `${tick.value}`}
                </SvgText>
              </G>
            );
          })}

          {/* Label "Goal" arriba del eje Y */}
          <SvgText
            x={padL - 4}
            y={getY(chartMax) - 5}
            textAnchor="end"
            fontSize={8}
            fill="#4A90E2"
            fontWeight="bold"
          >
            Goal
          </SvgText>

          {/* Eje Y */}
          <Path
            d={`M${padL},${padT} L${padL},${padT + innerH}`}
            stroke="#CCC"
            strokeWidth={1}
          />

          {/* Eje X */}
          <Path
            d={`M${padL},${padT + innerH} L${padL + innerW},${padT + innerH}`}
            stroke="#CCC"
            strokeWidth={1}
          />

          {/* Área de relleno */}
          <Path d={fillPath} fill="url(#hourlyFill)" />

          {/* Línea */}
          <Path
            d={linePath}
            stroke="#4A90E2"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos en horas con consumo */}
          {hourlyData.map((v, i) =>
            v > 0 ? (
              <Circle
                key={i}
                cx={getX(i)}
                cy={getY(v)}
                r={3.5}
                fill="#FFFFFF"
                stroke="#4A90E2"
                strokeWidth={2}
              />
            ) : null
          )}

          {/* Etiquetas eje X */}
          {[0, 6, 12, 18, 23].map((h) => (
            <SvgText
              key={h}
              x={getX(h)}
              y={CHART_HEIGHT - 8}
              textAnchor="middle"
              fontSize={10}
              fill="#888"
            >
              {h}h
            </SvgText>
          ))}
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
    // CHART_WIDTH = width-40 (tabContent padding), chartContainer has padding:20 on each side
    const innerWidth = CHART_WIDTH - 40;
    const cellSize = Math.floor(innerWidth / 7);
    const svgWidth = cellSize * 7;
    const weeks = Math.ceil(monthlyData.length / 7);
    const svgHeight = weeks * cellSize + 4;

    const getIntensity = (value) => {
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
        <Svg width={svgWidth} height={svgHeight}>
          {monthlyData.map((day, index) => {
            const row = Math.floor(index / 7);
            const col = index % 7;
            const intensity = getIntensity(day.consumed);

            return (
              <G key={index}>
                <Rect
                  x={col * cellSize + 2}
                  y={row * cellSize + 2}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  fill={getColor(intensity)}
                  rx={4}
                />
                <SvgText
                  x={col * cellSize + cellSize / 2}
                  y={row * cellSize + cellSize / 2 + 4}
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

      <HourlyLineChart hourlyData={hourlyData} />
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
  circularProgressInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  circularProgressNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  circularProgressGoalNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
  },
  circularProgressUnit: {
    fontSize: 12,
    color: '#888',
  },
  circularProgressOf: {
    fontSize: 12,
    color: '#888',
    marginVertical: 2,
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