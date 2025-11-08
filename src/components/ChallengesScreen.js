import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DatabaseService from '../services/DatabaseService';

const ChallengesScreen = () => {
  const [challenges, setChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'my-challenges'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allChallenges = await DatabaseService.getChallenges();
      const myChallenges = await DatabaseService.getUserChallenges();

      setChallenges(allChallenges);
      setUserChallenges(myChallenges);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallenge = async (challengeId) => {
    try {
      await DatabaseService.startChallenge(challengeId);
      Alert.alert('¡Reto Iniciado!', 'El reto ha sido agregado a tu lista');
      await loadData();
    } catch (error) {
      console.error('Failed to start challenge:', error);
      Alert.alert('Error', 'No se pudo iniciar el reto');
    }
  };

  const ChallengeCard = ({ challenge, isUserChallenge = false }) => {
    const progress = isUserChallenge ? challenge.progress : 0;
    const progressPercent = (progress / challenge.goal_value) * 100;

    return (
      <View style={styles.challengeCard}>
        <LinearGradient
          colors={[challenge.color || '#4A90E2', `${challenge.color || '#4A90E2'}CC`]}
          style={styles.challengeGradient}
        >
          <View style={styles.challengeHeader}>
            <View style={styles.challengeIconContainer}>
              <Ionicons name={challenge.icon || 'trophy'} size={32} color="#FFF" />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeName}>{challenge.name}</Text>
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
            </View>
          </View>

          {isUserChallenge ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {progress}/{challenge.goal_value} - {Math.round(progressPercent)}%
              </Text>
              <Text style={styles.statusText}>
                {challenge.status === 'active' ? '🔥 Activo' :
                 challenge.status === 'completed' ? '✅ Completado' :
                 '❌ Fallido'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartChallenge(challenge.id)}
            >
              <Ionicons name="play-circle" size={20} color="#FFF" />
              <Text style={styles.startButtonText}>Iniciar Reto</Text>
            </TouchableOpacity>
          )}

          <View style={styles.challengeMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color="#FFF" />
              <Text style={styles.metaText}>{challenge.duration_days} días</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="trophy" size={16} color="#FFF" />
              <Text style={styles.metaText}>Badge</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Cargando retos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Retos</Text>
        <Text style={styles.headerSubtitle}>Completa desafíos y gana insignias</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Disponibles ({challenges.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-challenges' && styles.activeTab]}
          onPress={() => setActiveTab('my-challenges')}
        >
          <Text style={[styles.tabText, activeTab === 'my-challenges' && styles.activeTabText]}>
            Mis Retos ({userChallenges.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'available' ? (
          challenges.length > 0 ? (
            challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No hay retos disponibles</Text>
            </View>
          )
        ) : (
          userChallenges.length > 0 ? (
            userChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} isUserChallenge />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No has iniciado ningún reto</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setActiveTab('available')}
              >
                <Text style={styles.emptyButtonText}>Ver Retos Disponibles</Text>
              </TouchableOpacity>
            </View>
          )
        )}
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
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4F8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  challengeCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeGradient: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  challengeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 5,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  challengeMeta: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metaText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 5,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChallengesScreen;
