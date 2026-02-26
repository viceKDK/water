import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useApp } from '../context/AppContext';
import CustomContainerModal from './CustomContainerModal';
import DatabaseService from '../services/DatabaseService';

const { width, height } = Dimensions.get('window');
const MAX_ITEMS = 5;

const formatLiters = (ml) => `${parseFloat((ml / 1000).toFixed(2))}L`;

const HomeScreen = () => {
  const { currentIntake, dailyGoal, containers, loading, logWater, addContainer } = useApp();

  const [showContainerModal, setShowContainerModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const itemAnims = useRef(
    Array.from({ length: MAX_ITEMS }, () => new Animated.ValueXY({ x: 0, y: 0 }))
  ).current;
  const itemOpacities = useRef(
    Array.from({ length: MAX_ITEMS }, () => new Animated.Value(0))
  ).current;
  const plusRotation = useRef(new Animated.Value(0)).current;

  const progressPercentage = Math.min((currentIntake / dailyGoal) * 100, 100);

  useEffect(() => { loadStreak(); }, []);

  const loadStreak = async () => {
    try {
      const streakDays = await DatabaseService.getStreakDays();
      setStreak(streakDays);
    } catch (error) {
      console.error('Failed to load streak:', error);
    }
  };

  const getCurrentDate = () =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  // Returns spread positions (fan above the + button)
  const getSpreadPositions = (count) => {
    const radius = 110;
    const startAngle = 210;
    const endAngle = 330;
    return Array.from({ length: count }, (_, i) => {
      const angle = count === 1
        ? 270
        : startAngle + (i / (count - 1)) * (endAngle - startAngle);
      const rad = (angle * Math.PI) / 180;
      return {
        x: Math.cos(rad) * radius,
        y: Math.sin(rad) * radius, // negative y = upward in screen coords
      };
    });
  };

  const toggleMenu = () => {
    const count = Math.min(containers.length, MAX_ITEMS);
    if (menuOpen) {
      Animated.parallel([
        Animated.timing(plusRotation, { toValue: 0, duration: 250, useNativeDriver: true }),
        ...itemAnims.slice(0, count).map(anim =>
          Animated.spring(anim, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: true })
        ),
        ...itemOpacities.slice(0, count).map(anim =>
          Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true })
        ),
      ]).start(() => setMenuOpen(false));
    } else {
      setMenuOpen(true);
      const positions = getSpreadPositions(count);
      Animated.parallel([
        Animated.timing(plusRotation, { toValue: 1, duration: 250, useNativeDriver: true }),
        ...itemAnims.slice(0, count).map((anim, i) =>
          Animated.spring(anim, {
            toValue: positions[i],
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          })
        ),
        ...itemOpacities.slice(0, count).map(anim =>
          Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true })
        ),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLogWater = async (amount, containerId = null) => {
    try {
      await logWater(amount, containerId);
      await loadStreak();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to log water:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleContainerSave = async (containerData) => {
    try {
      await addContainer(containerData);
      setShowContainerModal(false);
    } catch (error) {
      console.error('Failed to add container:', error);
    }
  };

  const plusRotateDeg = plusRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Backdrop — closes menu when tapping outside */}
      {menuOpen && (
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={toggleMenu}
          activeOpacity={1}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#FF6B35" />
              <Text style={styles.streakText}>{streak} day{streak !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
        <View style={styles.progressHeader}>
          <Text style={styles.intakeText}>{currentIntake.toLocaleString()}ml</Text>
          <Text style={styles.goalText}>/ {dailyGoal.toLocaleString()}ml</Text>
        </View>
      </View>

      {/* Human figure */}
      <View style={styles.visualizationContainer}>
        <Image
          source={require('../../assets/Gemini_Generated_Image_jq6ze7jq6ze7jq6z.png')}
          style={styles.humanImage}
          resizeMode="contain"
        />
      </View>

      {/* Bottom row: spacer | FAB radial menu | edit icon */}
      <View style={styles.bottomRow}>
        <View style={{ width: 44 }} />

        {/* FAB wrapper — floating items are positioned relative to this */}
        <View style={styles.fabWrapper}>
          {containers.slice(0, MAX_ITEMS).map((container, i) => (
            <Animated.View
              key={container.id}
              pointerEvents={menuOpen ? 'auto' : 'none'}
              style={[
                styles.floatingItem,
                {
                  opacity: itemOpacities[i],
                  transform: [
                    { translateX: itemAnims[i].x },
                    { translateY: itemAnims[i].y },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  handleLogWater(container.volume, container.id);
                  toggleMenu();
                }}
                style={styles.floatingItemButton}
              >
                <View style={[styles.floatingIconCircle, { backgroundColor: container.color }]}>
                  <Ionicons name={container.type} size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.floatingItemLabel}>{formatLiters(container.volume)}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* + / × button */}
          <TouchableOpacity style={styles.plusButton} onPress={toggleMenu}>
            <Animated.View style={{ transform: [{ rotate: plusRotateDeg }] }}>
              <Ionicons name="add" size={36} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Edit / add container icon */}
        <TouchableOpacity
          style={styles.customIconButton}
          onPress={() => setShowContainerModal(true)}
        >
          <Ionicons name="pencil-outline" size={22} color="#aaa" />
        </TouchableOpacity>
      </View>

      <CustomContainerModal
        visible={showContainerModal}
        onClose={() => setShowContainerModal(false)}
        onSave={handleContainerSave}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: '100%',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  intakeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0096C7',
  },
  goalText: {
    fontSize: 18,
    color: '#888',
    marginLeft: 4,
  },
  visualizationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  humanImage: {
    width: width * 0.62,
    height: height * 0.56,
  },
  // ── Bottom row ──────────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 24,
  },
  // FAB + radial items
  fabWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  floatingItem: {
    position: 'absolute',
    alignItems: 'center',
    width: 70,
    left: -3,   // (64 - 70) / 2
    top: -2,
    zIndex: 0,
  },
  floatingItemButton: {
    alignItems: 'center',
  },
  floatingIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 6,
  },
  floatingItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
    marginTop: 4,
  },
  plusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0096C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0096C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
  },
  customIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Loading ──────────────────────────────────────────────
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

export default HomeScreen;
