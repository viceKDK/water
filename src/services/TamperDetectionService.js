/**
 * TamperDetectionService
 *
 * Servicio para detectar manipulación no autorizada de datos.
 * Genera y verifica checksums de datos críticos.
 */

import { generateChecksum, verifyIntegrity } from '../utils/crypto';
import SecureStorageService from './SecureStorageService';
import DatabaseService from './DatabaseService';

class TamperDetectionService {
  constructor() {
    this.isInitialized = false;
    this.lastCheckTime = null;
  }

  /**
   * Inicializar el servicio
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Cargar última verificación
      const lastCheck = await SecureStorageService.getItem(
        SecureStorageService.KEYS.LAST_INTEGRITY_CHECK
      );

      if (lastCheck) {
        this.lastCheckTime = new Date(lastCheck);
      }

      this.isInitialized = true;
      console.log('🛡️ TamperDetectionService initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize TamperDetectionService:', error);
      return false;
    }
  }

  /**
   * Generar checksum de todos los datos críticos
   * @returns {Promise<string>} - Checksum generado
   */
  async generateDataChecksum() {
    try {
      // Recopilar datos críticos
      const criticalData = await this.gatherCriticalData();

      // Generar checksum
      const checksum = await generateChecksum(criticalData);

      // Guardar checksum y timestamp
      await SecureStorageService.setItem(
        SecureStorageService.KEYS.DATA_CHECKSUM,
        checksum
      );

      await SecureStorageService.setItem(
        SecureStorageService.KEYS.LAST_INTEGRITY_CHECK,
        new Date().toISOString()
      );

      this.lastCheckTime = new Date();

      console.log('✅ Data checksum generated:', checksum.substring(0, 16) + '...');
      return checksum;
    } catch (error) {
      console.error('Failed to generate data checksum:', error);
      throw error;
    }
  }

  /**
   * Recopilar datos críticos de la aplicación
   * @returns {Promise<object>} - Datos críticos
   */
  async gatherCriticalData() {
    try {
      await DatabaseService.initialize();

      // Obtener datos críticos de la base de datos
      const containers = await DatabaseService.getAllContainers();
      const dailyGoal = await DatabaseService.getSetting('dailyGoal', 2000);
      const settings = {
        dailyGoal,
        notificationsEnabled: await DatabaseService.getSetting('notificationsEnabled', true),
        notificationStartTime: await DatabaseService.getSetting('notificationStartTime', '08:00'),
        notificationEndTime: await DatabaseService.getSetting('notificationEndTime', '22:00'),
        notificationFrequency: await DatabaseService.getSetting('notificationFrequency', 'sixty'),
      };

      // Crear estructura de datos críticos
      return {
        containers: containers.map(c => ({
          id: c.id,
          name: c.name,
          volume: c.volume,
        })),
        settings,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to gather critical data:', error);
      // Retornar datos mínimos en caso de error
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to gather full data',
      };
    }
  }

  /**
   * Verificar integridad de los datos
   * @returns {Promise<{isValid: boolean, message: string}>}
   */
  async verifyDataIntegrity() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Obtener checksum almacenado
      const storedChecksum = await SecureStorageService.getItem(
        SecureStorageService.KEYS.DATA_CHECKSUM
      );

      if (!storedChecksum) {
        // Primera vez, generar checksum
        console.log('ℹ️ No stored checksum found, generating initial checksum');
        await this.generateDataChecksum();
        return {
          isValid: true,
          message: 'Initial checksum generated',
        };
      }

      // Recopilar datos actuales
      const currentData = await this.gatherCriticalData();

      // Verificar integridad
      const isValid = await verifyIntegrity(currentData, storedChecksum);

      if (!isValid) {
        console.warn('⚠️ Data integrity check FAILED!');
        console.warn('Stored checksum:', storedChecksum.substring(0, 16) + '...');

        // Generar nuevo checksum para comparación
        const currentChecksum = await generateChecksum(currentData);
        console.warn('Current checksum:', currentChecksum.substring(0, 16) + '...');

        return {
          isValid: false,
          message: 'Data integrity check failed - data may have been tampered with',
        };
      }

      console.log('✅ Data integrity check passed');

      // Actualizar timestamp de última verificación
      await SecureStorageService.setItem(
        SecureStorageService.KEYS.LAST_INTEGRITY_CHECK,
        new Date().toISOString()
      );
      this.lastCheckTime = new Date();

      return {
        isValid: true,
        message: 'Data integrity verified',
      };
    } catch (error) {
      console.error('Failed to verify data integrity:', error);
      return {
        isValid: false,
        message: `Verification error: ${error.message}`,
      };
    }
  }

  /**
   * Actualizar checksum después de cambios legítimos
   * Llamar después de operaciones que modifiquen datos críticos
   * @returns {Promise<boolean>}
   */
  async updateChecksum() {
    try {
      await this.generateDataChecksum();
      console.log('🔄 Checksum updated after data modification');
      return true;
    } catch (error) {
      console.error('Failed to update checksum:', error);
      return false;
    }
  }

  /**
   * Verificar si la última verificación fue hace mucho tiempo
   * @param {number} maxHours - Máximo de horas desde última verificación (default: 24)
   * @returns {boolean} - true si necesita verificación
   */
  needsVerification(maxHours = 24) {
    if (!this.lastCheckTime) {
      return true;
    }

    const hoursSinceLastCheck =
      (Date.now() - this.lastCheckTime.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastCheck >= maxHours;
  }

  /**
   * Resetear checksums (usar solo para debugging o reset completo)
   * @returns {Promise<boolean>}
   */
  async resetChecksums() {
    try {
      await SecureStorageService.deleteItem(SecureStorageService.KEYS.DATA_CHECKSUM);
      await SecureStorageService.deleteItem(SecureStorageService.KEYS.LAST_INTEGRITY_CHECK);
      this.lastCheckTime = null;

      console.log('🗑️ Checksums reset');
      return true;
    } catch (error) {
      console.error('Failed to reset checksums:', error);
      return false;
    }
  }

  /**
   * Obtener información del estado de verificación
   * @returns {Promise<object>}
   */
  async getVerificationStatus() {
    const storedChecksum = await SecureStorageService.getItem(
      SecureStorageService.KEYS.DATA_CHECKSUM
    );

    const lastCheck = await SecureStorageService.getItem(
      SecureStorageService.KEYS.LAST_INTEGRITY_CHECK
    );

    return {
      hasChecksum: !!storedChecksum,
      lastCheckTime: lastCheck ? new Date(lastCheck) : null,
      needsVerification: this.needsVerification(),
      isInitialized: this.isInitialized,
    };
  }
}

// Export singleton instance
export default new TamperDetectionService();
