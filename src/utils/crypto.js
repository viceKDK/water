/**
 * Crypto Utilities
 *
 * Funciones de criptografía para hashing, encriptación y verificación de integridad.
 */

import * as Crypto from 'expo-crypto';

/**
 * Hash de datos usando SHA-256
 * @param {string} data - Datos a hashear
 * @returns {Promise<string>} - Hash en hexadecimal
 */
export async function hashData(data) {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return hash;
  } catch (error) {
    console.error('Failed to hash data:', error);
    throw error;
  }
}

/**
 * Hash de datos usando SHA-512 (más seguro)
 * @param {string} data - Datos a hashear
 * @returns {Promise<string>} - Hash en hexadecimal
 */
export async function hashDataSecure(data) {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      data
    );
    return hash;
  } catch (error) {
    console.error('Failed to hash data securely:', error);
    throw error;
  }
}

/**
 * Hash con salt para mayor seguridad
 * @param {string} data - Datos a hashear
 * @param {string} salt - Salt opcional (se genera si no se provee)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashWithSalt(data, salt = null) {
  try {
    const usedSalt = salt || await generateSalt();
    const combined = `${data}${usedSalt}`;

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      combined
    );

    return { hash, salt: usedSalt };
  } catch (error) {
    console.error('Failed to hash with salt:', error);
    throw error;
  }
}

/**
 * Generar un salt aleatorio
 * @param {number} byteLength - Longitud en bytes (default: 16)
 * @returns {Promise<string>} - Salt en hexadecimal
 */
export async function generateSalt(byteLength = 16) {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(byteLength);
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Failed to generate salt:', error);
    throw error;
  }
}

/**
 * Verificar si un dato coincide con un hash
 * @param {string} data - Datos originales
 * @param {string} hash - Hash a verificar
 * @param {string} salt - Salt usado (opcional)
 * @returns {Promise<boolean>} - true si coinciden
 */
export async function verifyHash(data, hash, salt = null) {
  try {
    const dataToHash = salt ? `${data}${salt}` : data;
    const algorithm = salt
      ? Crypto.CryptoDigestAlgorithm.SHA512
      : Crypto.CryptoDigestAlgorithm.SHA256;

    const computedHash = await Crypto.digestStringAsync(algorithm, dataToHash);
    return computedHash === hash;
  } catch (error) {
    console.error('Failed to verify hash:', error);
    return false;
  }
}

/**
 * Encriptación simple de datos (XOR con clave)
 * Nota: Para producción, considera usar librerías más robustas como crypto-js
 * @param {string} data - Datos a encriptar
 * @param {string} key - Clave de encriptación
 * @returns {string} - Datos encriptados en Base64
 */
export function simpleEncrypt(data, key) {
  try {
    const keyBytes = key.split('').map(char => char.charCodeAt(0));
    const dataBytes = data.split('').map(char => char.charCodeAt(0));

    const encrypted = dataBytes.map((byte, index) => {
      return byte ^ keyBytes[index % keyBytes.length];
    });

    // Convertir a Base64
    return btoa(String.fromCharCode(...encrypted));
  } catch (error) {
    console.error('Failed to encrypt data:', error);
    throw error;
  }
}

/**
 * Desencriptación simple de datos (XOR con clave)
 * @param {string} encryptedData - Datos encriptados en Base64
 * @param {string} key - Clave de encriptación
 * @returns {string} - Datos desencriptados
 */
export function simpleDecrypt(encryptedData, key) {
  try {
    // Decodificar de Base64
    const decoded = atob(encryptedData);
    const encryptedBytes = decoded.split('').map(char => char.charCodeAt(0));
    const keyBytes = key.split('').map(char => char.charCodeAt(0));

    const decrypted = encryptedBytes.map((byte, index) => {
      return byte ^ keyBytes[index % keyBytes.length];
    });

    return String.fromCharCode(...decrypted);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    throw error;
  }
}

/**
 * Generar checksum de datos para verificar integridad
 * @param {any} data - Datos (será convertido a JSON si es objeto)
 * @returns {Promise<string>} - Checksum SHA-256
 */
export async function generateChecksum(data) {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return await hashData(dataString);
  } catch (error) {
    console.error('Failed to generate checksum:', error);
    throw error;
  }
}

/**
 * Verificar integridad de datos usando checksum
 * @param {any} data - Datos a verificar
 * @param {string} expectedChecksum - Checksum esperado
 * @returns {Promise<boolean>} - true si la integridad es válida
 */
export async function verifyIntegrity(data, expectedChecksum) {
  try {
    const currentChecksum = await generateChecksum(data);
    return currentChecksum === expectedChecksum;
  } catch (error) {
    console.error('Failed to verify integrity:', error);
    return false;
  }
}

/**
 * Generar UUID v4 aleatorio
 * @returns {Promise<string>} - UUID
 */
export async function generateUUID() {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const hex = Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    // Formatear como UUID v4
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-4${hex.substring(13, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  } catch (error) {
    console.error('Failed to generate UUID:', error);
    // Fallback a timestamp-based UUID
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Generar token aleatorio
 * @param {number} length - Longitud del token en bytes (default: 32)
 * @returns {Promise<string>} - Token en hexadecimal
 */
export async function generateToken(length = 32) {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Failed to generate token:', error);
    throw error;
  }
}
