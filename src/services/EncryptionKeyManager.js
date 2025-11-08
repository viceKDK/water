/**
 * EncryptionKeyManager
 *
 * Gestor de claves de encriptación para la aplicación.
 * Genera, almacena y rota claves de forma segura.
 */

import * as Crypto from 'expo-crypto';
import SecureStorageService from './SecureStorageService';

class EncryptionKeyManager {
  constructor() {
    this.masterKey = null;
    this.isInitialized = false;
  }

  /**
   * Inicializar el gestor de claves
   * @returns {Promise<boolean>} - true si se inicializó correctamente
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Obtener o crear la master key
      this.masterKey = await this.getOrCreateMasterKey();
      this.isInitialized = true;
      console.log('🔐 EncryptionKeyManager initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize EncryptionKeyManager:', error);
      return false;
    }
  }

  /**
   * Generar una clave segura aleatoria
   * @param {number} byteLength - Longitud en bytes (default: 32 para AES-256)
   * @returns {Promise<string>} - Clave en formato hexadecimal
   */
  async generateSecureKey(byteLength = 32) {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(byteLength);

      // Convertir a hexadecimal
      return Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Failed to generate secure key:', error);
      throw error;
    }
  }

  /**
   * Obtener o crear la master key
   * @returns {Promise<string>} - Master key
   */
  async getOrCreateMasterKey() {
    const existingKey = await SecureStorageService.getItem(
      SecureStorageService.KEYS.MASTER_KEY
    );

    if (existingKey) {
      console.log('✅ Master key loaded from secure storage');
      return existingKey;
    }

    // Crear nueva master key
    console.log('🔑 Generating new master key...');
    const newKey = await this.generateSecureKey(32);

    await SecureStorageService.setItem(
      SecureStorageService.KEYS.MASTER_KEY,
      newKey
    );

    console.log('✅ Master key created and stored securely');
    return newKey;
  }

  /**
   * Obtener la master key actual
   * @returns {Promise<string>} - Master key
   */
  async getMasterKey() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.masterKey;
  }

  /**
   * Rotar la master key (generar una nueva)
   * IMPORTANTE: Esto requiere re-encriptar todos los datos
   * @returns {Promise<{oldKey: string, newKey: string}>}
   */
  async rotateMasterKey() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const oldKey = this.masterKey;
    const newKey = await this.generateSecureKey(32);

    // Guardar nueva clave
    await SecureStorageService.setItem(
      SecureStorageService.KEYS.MASTER_KEY,
      newKey
    );

    this.masterKey = newKey;

    console.log('🔄 Master key rotated successfully');

    return { oldKey, newKey };
  }

  /**
   * Generar clave derivada de la master key
   * Útil para encriptar diferentes tipos de datos
   * @param {string} salt - Salt único para derivación
   * @returns {Promise<string>} - Clave derivada
   */
  async derivedKey(salt) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const combined = `${this.masterKey}${salt}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );

    return hash;
  }

  /**
   * Verificar integridad de la master key
   * @returns {Promise<boolean>} - true si la clave es válida
   */
  async verifyKeyIntegrity() {
    try {
      const key = await SecureStorageService.getItem(
        SecureStorageService.KEYS.MASTER_KEY
      );

      if (!key) {
        return false;
      }

      // Verificar que la clave tenga el formato correcto (64 caracteres hex para 32 bytes)
      if (key.length !== 64) {
        console.error('Master key has invalid length');
        return false;
      }

      // Verificar que solo contenga caracteres hexadecimales
      if (!/^[0-9a-f]+$/i.test(key)) {
        console.error('Master key contains invalid characters');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to verify key integrity:', error);
      return false;
    }
  }

  /**
   * Eliminar todas las claves (usar solo para reset completo)
   * @returns {Promise<boolean>}
   */
  async deleteAllKeys() {
    try {
      await SecureStorageService.deleteItem(SecureStorageService.KEYS.MASTER_KEY);
      await SecureStorageService.deleteItem(SecureStorageService.KEYS.ENCRYPTION_KEY);

      this.masterKey = null;
      this.isInitialized = false;

      console.log('🗑️ All encryption keys deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete keys:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new EncryptionKeyManager();
