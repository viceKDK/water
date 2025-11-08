/**
 * SecureStorageService
 *
 * Servicio para almacenamiento seguro de datos sensibles usando expo-secure-store.
 * En iOS, usa el Keychain. En Android, usa EncryptedSharedPreferences.
 */

import * as SecureStore from 'expo-secure-store';

// Claves predefinidas para la app
export const SECURE_STORAGE_KEYS = {
  ENCRYPTION_KEY: 'db_encryption_key',
  MASTER_KEY: 'master_key',
  DATA_CHECKSUM: 'data_checksum',
  LAST_INTEGRITY_CHECK: 'last_integrity_check',
  USER_PIN: 'user_pin_hash',
  BIOMETRIC_ENABLED: 'biometric_enabled',
};

class SecureStorageService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Guardar un valor de forma segura
   * @param {string} key - Clave única
   * @param {any} value - Valor a guardar (será convertido a JSON)
   * @returns {Promise<boolean>} - true si se guardó exitosamente
   */
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      await SecureStore.setItemAsync(key, stringValue, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });

      return true;
    } catch (error) {
      console.error(`Failed to save to secure store (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Obtener un valor del almacenamiento seguro
   * @param {string} key - Clave del valor
   * @param {any} defaultValue - Valor por defecto si no existe
   * @returns {Promise<any>} - Valor almacenado o defaultValue
   */
  async getItem(key, defaultValue = null) {
    try {
      const value = await SecureStore.getItemAsync(key);

      if (value === null || value === undefined) {
        return defaultValue;
      }

      // Intentar parsear como JSON
      try {
        return JSON.parse(value);
      } catch {
        // Si no es JSON, devolver como string
        return value;
      }
    } catch (error) {
      console.error(`Failed to get from secure store (key: ${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * Eliminar un valor del almacenamiento seguro
   * @param {string} key - Clave del valor a eliminar
   * @returns {Promise<boolean>} - true si se eliminó exitosamente
   */
  async deleteItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete from secure store (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Verificar si existe una clave
   * @param {string} key - Clave a verificar
   * @returns {Promise<boolean>} - true si existe
   */
  async hasItem(key) {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value !== null && value !== undefined;
    } catch (error) {
      console.error(`Failed to check secure store (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Limpiar todos los valores (usar con precaución)
   * Nota: SecureStore no tiene un método clear(), así que debes eliminar claves específicas
   * @param {string[]} keys - Array de claves a eliminar
   * @returns {Promise<boolean>} - true si todas se eliminaron exitosamente
   */
  async clearMultiple(keys) {
    try {
      const promises = keys.map(key => this.deleteItem(key));
      const results = await Promise.all(promises);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Failed to clear multiple keys from secure store:', error);
      return false;
    }
  }
}

// Create singleton instance
const secureStorageServiceInstance = new SecureStorageService();

// Add KEYS property to instance for backward compatibility
secureStorageServiceInstance.KEYS = SECURE_STORAGE_KEYS;

// Export singleton instance
export default secureStorageServiceInstance;
