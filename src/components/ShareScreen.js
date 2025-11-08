import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';

const ShareScreen = () => {
  const { currentIntake, dailyGoal, stats } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState('daily');
  const viewShotRef = useRef();

  const progressPercentage = Math.min((currentIntake / dailyGoal) * 100, 100);

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Compartir no disponible', 'Esta función no está disponible en tu dispositivo');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'No se pudo compartir la imagen');
    }
  };

  const renderDailyTemplate = () => (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
      <LinearGradient
        colors={['#4A90E2', '#87CEEB']}
        style={styles.shareCard}
      >
        <View style={styles.shareHeader}>
          <Ionicons name="water" size={48} color="#FFF" />
          <Text style={styles.shareTitle}>Water Reminder</Text>
        </View>

        <View style={styles.shareStats}>
          <Text style={styles.shareMainStat}>{currentIntake}ml</Text>
          <Text style={styles.shareSubStat}>de {dailyGoal}ml</Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>

          <Text style={styles.sharePercentage}>{Math.round(progressPercentage)}% Completado</Text>
        </View>

        {stats.streak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={24} color="#FF6B35" />
            <Text style={styles.streakText}>{stats.streak} días de racha</Text>
          </View>
        )}

        <Text style={styles.shareFooter}>¡Mantente hidratado! 💧</Text>
      </LinearGradient>
    </ViewShot>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compartir Progreso</Text>
        <Text style={styles.headerSubtitle}>Comparte tus logros con amigos</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.templateSelector}>
          <TouchableOpacity
            style={[styles.templateBtn, selectedTemplate === 'daily' && styles.templateBtnActive]}
            onPress={() => setSelectedTemplate('daily')}
          >
            <Ionicons name="today" size={24} color={selectedTemplate === 'daily' ? '#4A90E2' : '#666'} />
            <Text style={[styles.templateBtnText, selectedTemplate === 'daily' && styles.templateBtnTextActive]}>
              Hoy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.templateBtn, selectedTemplate === 'weekly' && styles.templateBtnActive]}
            onPress={() => setSelectedTemplate('weekly')}
          >
            <Ionicons name="calendar" size={24} color={selectedTemplate === 'weekly' ? '#4A90E2' : '#666'} />
            <Text style={[styles.templateBtnText, selectedTemplate === 'weekly' && styles.templateBtnTextActive]}>
              Semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.templateBtn, selectedTemplate === 'streak' && styles.templateBtnActive]}
            onPress={() => setSelectedTemplate('streak')}
          >
            <Ionicons name="flame" size={24} color={selectedTemplate === 'streak' ? '#4A90E2' : '#666'} />
            <Text style={[styles.templateBtnText, selectedTemplate === 'streak' && styles.templateBtnTextActive]}>
              Racha
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Vista Previa</Text>
          {renderDailyTemplate()}
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={24} color="#FFF" />
          <Text style={styles.shareButtonText}>Compartir</Text>
        </TouchableOpacity>

        <View style={styles.shareOptions}>
          <Text style={styles.sectionTitle}>Opciones de Compartir</Text>

          <TouchableOpacity style={styles.optionBtn}>
            <Ionicons name="logo-instagram" size={24} color="#E4405F" />
            <Text style={styles.optionText}>Instagram Story</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn}>
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            <Text style={styles.optionText}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn}>
            <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
            <Text style={styles.optionText}>Twitter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.optionText}>WhatsApp</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  templateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  templateBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F4F8',
  },
  templateBtnActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F9FF',
  },
  templateBtnText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  templateBtnTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  preview: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  shareCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  shareHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shareTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  shareStats: {
    alignItems: 'center',
    width: '100%',
  },
  shareMainStat: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  shareSubStat: {
    fontSize: 20,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 6,
  },
  sharePercentage: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  streakText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  shareFooter: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFF',
    fontStyle: 'italic',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 12,
    marginBottom: 30,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  shareOptions: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F4F8',
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
});

export default ShareScreen;
