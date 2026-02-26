import React, { useState, useEffect, useContext, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useApp } from '../context/AppContext';
import CustomContainerModal from './CustomContainerModal';
import DatabaseService from '../services/DatabaseService';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const {
    currentIntake,
    dailyGoal,
    containers,
    loading,
    logWater,
    addContainer,
  } = useApp();

  const [animatedValue] = useState(new Animated.Value(0));
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [streak, setStreak] = useState(0);

  const progressPercentage = Math.min((currentIntake / dailyGoal) * 100, 100);

  useEffect(() => {
    loadStreak();
  }, []);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progressPercentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [currentIntake]);

  const loadStreak = async () => {
    try {
      const streakDays = await DatabaseService.getStreakDays();
      setStreak(streakDays);
    } catch (error) {
      console.error('Failed to load streak:', error);
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
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


  const ContainerButton = ({ container, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(container.volume, container.id)}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.containerButton,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.containerIconContainer, { backgroundColor: container.color }]}>
            <Ionicons name={container.type} size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.containerLabel}>{container.name}</Text>
          <Text style={styles.containerAmount}>{container.volume}ml</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.intakeText}>
            {currentIntake.toLocaleString()}ml
          </Text>
          <Text style={styles.goalText}>/ {dailyGoal.toLocaleString()}ml</Text>
        </View>
      </View>

      {/* Main Visualization Area */}
      <View style={styles.visualizationContainer}>
        <Image
          source={require('../../assets/Gemini_Generated_Image_jq6ze7jq6ze7jq6z.png')}
          style={styles.humanImage}
          resizeMode="contain"
        />
      </View>

      {/* Quick Log Panel */}
      <View style={styles.quickLogPanel}>
        <Text style={styles.quickLogTitle}>Quick Log</Text>
        
        <View style={styles.containerButtonsRow}>
          {containers.slice(0, 3).map((container) => (
            <ContainerButton
              key={container.id}
              container={container}
              onPress={handleLogWater}
            />
          ))}
        </View>

        {/* Custom Container Button */}
        <TouchableOpacity 
          style={styles.customButton}
          onPress={() => setShowContainerModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#4A90E2" />
          <Text style={styles.customButtonText}>Add Custom Container</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Container Modal */}
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
    color: '#00B4DB',
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
    width: width * 0.55,
    height: height * 0.45,
  },
  quickLogPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quickLogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  containerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  containerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginHorizontal: 5,
  },
  containerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#00B4DB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  containerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  containerAmount: {
    fontSize: 12,
    color: '#00B4DB',
    fontWeight: '600',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  customButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 8,
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

export default HomeScreen;
