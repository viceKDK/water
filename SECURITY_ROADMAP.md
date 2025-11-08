# 🔒 Roadmap de Seguridad - Water Reminder App

## Objetivo
Implementar medidas de seguridad robustas para proteger la base de datos SQLite y los datos del usuario contra acceso no autorizado, reverse engineering y manipulación.

---

## 📋 Tabla de Contenidos
1. [Fase 1: Seguridad Básica](#fase-1-seguridad-básica)
2. [Fase 2: Encriptación de Base de Datos](#fase-2-encriptación-de-base-de-datos)
3. [Fase 3: Protección de Código](#fase-3-protección-de-código)
4. [Fase 4: Seguridad Avanzada](#fase-4-seguridad-avanzada)
5. [Fase 5: Monitoreo y Auditoría](#fase-5-monitoreo-y-auditoría)

---

## Fase 1: Seguridad Básica

### ✅ Estado Actual
- [x] App solo para móvil (eliminado soporte web)
- [x] Base de datos SQLite local
- [ ] Sin encriptación
- [ ] Sin protección de código

### 🎯 Objetivos de Fase 1

#### 1.1 Implementar SQLCipher para Encriptación de BD
**Prioridad: ALTA** | **Tiempo estimado: 2-3 días**

SQLCipher es una extensión de SQLite que proporciona encriptación AES-256 transparente.

**Instalación:**
```bash
npm install @journeyapps/react-native-sqlcipher-2
npx pod-install
```

**Implementación:**
```javascript
// src/services/DatabaseService.js
import SQLite from '@journeyapps/react-native-sqlcipher-2';

class DatabaseService {
  async initialize() {
    // Generar o recuperar clave de encriptación
    const encryptionKey = await this.getEncryptionKey();

    this.db = await SQLite.openDatabase({
      name: 'waterminder.db',
      key: encryptionKey,
      location: 'default'
    });
  }

  async getEncryptionKey() {
    // Usar react-native-keychain para almacenar la clave de forma segura
    const credentials = await Keychain.getGenericPassword({
      service: 'waterminder.encryption'
    });

    if (credentials) {
      return credentials.password;
    } else {
      // Generar nueva clave
      const newKey = await this.generateSecureKey();
      await Keychain.setGenericPassword('encryption', newKey, {
        service: 'waterminder.encryption',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED
      });
      return newKey;
    }
  }

  async generateSecureKey() {
    // Generar clave aleatoria de 256 bits
    const randomBytes = await crypto.getRandomValues(new Uint8Array(32));
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

**Dependencias necesarias:**
```bash
npm install react-native-keychain
npm install expo-crypto
```

#### 1.2 Secure Storage para Configuraciones Sensibles
**Prioridad: ALTA** | **Tiempo estimado: 1 día**

Usar `expo-secure-store` para almacenar datos sensibles:

```javascript
// src/services/SecureStorage.js
import * as SecureStore from 'expo-secure-store';

class SecureStorageService {
  async setItem(key, value) {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to secure store:', error);
    }
  }

  async getItem(key) {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to get from secure store:', error);
      return null;
    }
  }

  async deleteItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Failed to delete from secure store:', error);
    }
  }
}

export default new SecureStorageService();
```

**Instalación:**
```bash
npx expo install expo-secure-store
```

#### 1.3 Hashing de Datos Sensibles
**Prioridad: MEDIA** | **Tiempo estimado: 1 día**

Implementar hashing para datos que no necesitan ser reversibles:

```javascript
// src/utils/crypto.js
import * as Crypto from 'expo-crypto';

export async function hashData(data) {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hash;
}

export async function hashWithSalt(data, salt = null) {
  const usedSalt = salt || await generateSalt();
  const combined = `${data}${usedSalt}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA512,
    combined
  );
  return { hash, salt: usedSalt };
}

async function generateSalt() {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Uso en DatabaseService:
// const { hash, salt } = await hashWithSalt(sensitiveData);
// await db.runAsync('INSERT INTO secrets (hash, salt) VALUES (?, ?)', [hash, salt]);
```

---

## Fase 2: Encriptación de Base de Datos

### 🎯 Objetivos de Fase 2

#### 2.1 Migrar a SQLCipher
**Prioridad: CRÍTICA** | **Tiempo estimado: 3-4 días**

**Pasos:**

1. **Backup de datos existentes**
```javascript
async migrateToEncrypted() {
  // 1. Exportar datos de BD no encriptada
  const oldData = await this.exportAllData();

  // 2. Cerrar BD actual
  await this.db.closeAsync();

  // 3. Eliminar BD antigua
  await FileSystem.deleteAsync(oldDbPath);

  // 4. Crear nueva BD encriptada
  await this.initialize(); // Con SQLCipher

  // 5. Importar datos
  await this.importAllData(oldData);
}
```

2. **Implementar key rotation**
```javascript
async rotateEncryptionKey() {
  const newKey = await this.generateSecureKey();

  // SQLCipher permite cambiar la clave
  await this.db.execAsync(`PRAGMA rekey = '${newKey}'`);

  // Guardar nueva clave
  await Keychain.setGenericPassword('encryption', newKey, {
    service: 'waterminder.encryption'
  });
}
```

#### 2.2 Protección contra SQL Injection
**Prioridad: ALTA** | **Tiempo estimado: 2 días**

**Validación de inputs:**
```javascript
// src/utils/validation.js
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Eliminar caracteres peligrosos
  return input
    .replace(/['"`;]/g, '')
    .trim();
}

export function validateWaterAmount(amount) {
  const num = parseInt(amount);
  if (isNaN(num) || num < 0 || num > 10000) {
    throw new Error('Invalid water amount');
  }
  return num;
}
```

**Usar siempre prepared statements:**
```javascript
// ✅ CORRECTO
await db.runAsync(
  'INSERT INTO water_intake (amount) VALUES (?)',
  [sanitizedAmount]
);

// ❌ INCORRECTO - vulnerable a SQL injection
await db.runAsync(
  `INSERT INTO water_intake (amount) VALUES (${amount})`
);
```

---

## Fase 3: Protección de Código

### 🎯 Objetivos de Fase 3

#### 3.1 Code Obfuscation
**Prioridad: ALTA** | **Tiempo estimado: 2 días**

Ofuscar código JavaScript para dificultar reverse engineering:

**Instalación:**
```bash
npm install --save-dev javascript-obfuscator
npm install --save-dev metro-react-native-babel-preset
```

**Configuración:**
```javascript
// metro.config.js
const JavaScriptObfuscator = require('javascript-obfuscator');

module.exports = {
  transformer: {
    babelTransformerPath: require.resolve('./transformer.js'),
  },
};

// transformer.js
const upstreamTransformer = require('metro-react-native-babel-preset');
const JavaScriptObfuscator = require('javascript-obfuscator');

module.exports.transform = function({ src, filename, options }) {
  const transformed = upstreamTransformer.transform({ src, filename, options });

  if (filename.includes('DatabaseService') ||
      filename.includes('SecureStorage')) {
    const obfuscated = JavaScriptObfuscator.obfuscate(
      transformed.code,
      {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        debugProtection: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
        rotateStringArray: true,
        shuffleStringArray: true,
        splitStrings: true,
        transformObjectKeys: true,
      }
    );

    return {
      ...transformed,
      code: obfuscated.getObfuscatedCode(),
    };
  }

  return transformed;
};
```

#### 3.2 ProGuard (Android) y Symbol Stripping (iOS)
**Prioridad: MEDIA** | **Tiempo estimado: 1 día**

**Android (ProGuard):**
```gradle
// android/app/build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
  }
}
```

**ProGuard rules:**
```
# android/app/proguard-rules.pro
-keep class com.waterminder.** { *; }
-keepclassmembers class ** {
  @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-dontwarn com.facebook.react.**
```

**iOS (Strip Debug Symbols):**
```xml
<!-- ios/WaterMinder/Info.plist -->
<key>STRIP_INSTALLED_PRODUCT</key>
<true/>
<key>COPY_PHASE_STRIP</key>
<true/>
```

#### 3.3 Environment Variables y Secrets
**Prioridad: ALTA** | **Tiempo estimado: 1 día**

```bash
npm install react-native-dotenv
```

```javascript
// .env (NUNCA commitear este archivo)
ENCRYPTION_SALT=your-secret-salt-here
API_KEY=your-api-key
```

```javascript
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }]
  ]
};

// Uso:
import { ENCRYPTION_SALT } from '@env';
```

**Añadir a .gitignore:**
```
.env
.env.local
.env.*.local
```

---

## Fase 4: Seguridad Avanzada

### 🎯 Objetivos de Fase 4

#### 4.1 Root/Jailbreak Detection
**Prioridad: MEDIA** | **Tiempo estimado: 2 días**

```bash
npm install jail-monkey
```

```javascript
// src/utils/security.js
import JailMonkey from 'jail-monkey';

export function checkDeviceSecurity() {
  const checks = {
    isJailBroken: JailMonkey.isJailBroken(),
    canMockLocation: JailMonkey.canMockLocation(),
    isOnExternalStorage: JailMonkey.isOnExternalStorage(),
    isDebuggedMode: JailMonkey.isDebuggedMode(),
    hookDetected: JailMonkey.hookDetected(),
  };

  const isTrusted = !Object.values(checks).some(check => check);

  return { isTrusted, checks };
}

// Uso en App.js
useEffect(() => {
  const { isTrusted, checks } = checkDeviceSecurity();

  if (!isTrusted) {
    Alert.alert(
      'Security Warning',
      'This device may be compromised. Some features may be disabled.',
      [{ text: 'OK', onPress: () => console.log('User acknowledged') }]
    );

    // Opcional: Deshabilitar funciones sensibles
    setSecureMode(false);
  }
}, []);
```

#### 4.2 Certificate Pinning
**Prioridad: BAJA** (solo si tienes API)
**Tiempo estimado: 2 días**

```bash
npm install react-native-ssl-pinning
```

```javascript
import { fetch as sslFetch } from 'react-native-ssl-pinning';

const certificatePinning = {
  url: 'https://api.waterminder.com',
  sslPinning: {
    certs: ['cert1', 'cert2'] // SHA-256 hashes
  }
};

const response = await sslFetch(
  'https://api.waterminder.com/data',
  {
    method: 'GET',
    timeoutInterval: 10000,
    sslPinning: certificatePinning.sslPinning
  }
);
```

#### 4.3 Biometric Authentication
**Prioridad: MEDIA** | **Tiempo estimado: 2 días**

```bash
npx expo install expo-local-authentication
```

```javascript
// src/services/BiometricAuth.js
import * as LocalAuthentication from 'expo-local-authentication';

class BiometricAuthService {
  async isAvailable() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  async authenticate(reason = 'Authenticate to access your data') {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  async getSupportedTypes() {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }
}

export default new BiometricAuthService();

// Uso en App.js
useEffect(() => {
  async function checkAuth() {
    const isAvailable = await BiometricAuthService.isAvailable();

    if (isAvailable) {
      const isAuthenticated = await BiometricAuthService.authenticate();

      if (!isAuthenticated) {
        // Bloquear app o cerrar
        Alert.alert('Authentication Failed', 'Please try again');
      }
    }
  }

  checkAuth();
}, []);
```

#### 4.4 Tamper Detection
**Prioridad: MEDIA** | **Tiempo estimado: 3 días**

```javascript
// src/utils/tamperDetection.js
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TamperDetection {
  async generateChecksum() {
    // Generar checksum de archivos críticos
    const criticalData = {
      containers: await DatabaseService.getAllContainers(),
      settings: await DatabaseService.getSettings(),
      timestamp: Date.now(),
    };

    const dataString = JSON.stringify(criticalData);
    const checksum = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataString
    );

    await AsyncStorage.setItem('app_checksum', checksum);
    return checksum;
  }

  async verifyIntegrity() {
    const storedChecksum = await AsyncStorage.getItem('app_checksum');

    if (!storedChecksum) {
      // Primera vez, generar checksum
      await this.generateChecksum();
      return true;
    }

    const currentChecksum = await this.generateChecksum();

    if (storedChecksum !== currentChecksum) {
      console.warn('⚠️ Data integrity check failed!');
      return false;
    }

    return true;
  }
}

export default new TamperDetection();
```

#### 4.5 Secure File Storage
**Prioridad: BAJA** | **Tiempo estimado: 1 día**

```javascript
// Proteger archivos con permisos restrictivos (solo iOS/Android)
import * as FileSystem from 'expo-file-system';

async function saveSecureFile(filename, data) {
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, data, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // iOS: Proteger con Data Protection
  if (Platform.OS === 'ios') {
    await FileSystem.setAttributesAsync(fileUri, {
      NSFileProtectionKey: FileSystem.NSFileProtectionComplete,
    });
  }

  // Android: Los archivos en documentDirectory ya están protegidos
}
```

---

## Fase 5: Monitoreo y Auditoría

### 🎯 Objetivos de Fase 5

#### 5.1 Logging Seguro
**Prioridad: MEDIA** | **Tiempo estimado: 2 días**

```javascript
// src/utils/secureLogger.js
import * as FileSystem from 'expo-file-system';

class SecureLogger {
  constructor() {
    this.logFile = `${FileSystem.documentDirectory}secure.log`;
  }

  async log(level, message, metadata = {}) {
    if (__DEV__) {
      console.log(`[${level}] ${message}`, metadata);
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: this.sanitizeMetadata(metadata),
    };

    await this.writeToFile(entry);
  }

  sanitizeMetadata(metadata) {
    // Eliminar datos sensibles
    const sanitized = { ...metadata };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.encryptionKey;
    return sanitized;
  }

  async writeToFile(entry) {
    const existingLogs = await this.readLogs();
    const newLogs = [...existingLogs, entry].slice(-1000); // Mantener solo últimas 1000 entradas

    await FileSystem.writeAsStringAsync(
      this.logFile,
      JSON.stringify(newLogs)
    );
  }

  async readLogs() {
    try {
      const content = await FileSystem.readAsStringAsync(this.logFile);
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  // Métodos de conveniencia
  info(message, metadata) { return this.log('INFO', message, metadata); }
  warn(message, metadata) { return this.log('WARN', message, metadata); }
  error(message, metadata) { return this.log('ERROR', message, metadata); }
  security(message, metadata) { return this.log('SECURITY', message, metadata); }
}

export default new SecureLogger();

// Uso:
import logger from './utils/secureLogger';

logger.security('Encryption key rotated', { userId: user.id });
logger.error('Database initialization failed', { error: error.message });
```

#### 5.2 Crash Reporting (sin exponer datos sensibles)
**Prioridad: BAJA** | **Tiempo estimado: 1 día**

```bash
npx expo install expo-error-reporter
# o
npm install @sentry/react-native
```

```javascript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN',
  beforeSend(event, hint) {
    // Sanitizar datos sensibles antes de enviar
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    // Eliminar valores de variables sensibles
    if (event.extra) {
      delete event.extra.encryptionKey;
      delete event.extra.userToken;
    }

    return event;
  },
});
```

#### 5.3 Auditoría de Acceso a BD
**Prioridad: BAJA** | **Tiempo estimado: 2 días**

```javascript
// DatabaseService.js - Añadir auditoría
class DatabaseService {
  async logWaterIntake(amount, containerId = null) {
    await logger.info('Water intake logged', {
      amount,
      containerId,
      timestamp: new Date().toISOString(),
    });

    // Lógica original
    const result = await this.db.runAsync(...);

    return result;
  }

  async getSetting(key, defaultValue = null) {
    await logger.info('Setting accessed', { key });

    // Solo en desarrollo, alertar si se accede a claves sensibles
    if (__DEV__ && key.includes('key') || key.includes('password')) {
      logger.warn('Accessing sensitive setting', { key });
    }

    return await this.db.getFirstAsync(...);
  }
}
```

---

## 📊 Resumen de Implementación

### Prioridades por Fase

| Fase | Prioridad | Tiempo | Dependencias |
|------|-----------|--------|--------------|
| **Fase 1** | 🔴 CRÍTICA | 4-5 días | expo-secure-store, react-native-keychain |
| **Fase 2** | 🔴 CRÍTICA | 5-6 días | @journeyapps/react-native-sqlcipher-2 |
| **Fase 3** | 🟡 ALTA | 4 días | javascript-obfuscator, react-native-dotenv |
| **Fase 4** | 🟢 MEDIA | 6-9 días | jail-monkey, expo-local-authentication |
| **Fase 5** | 🔵 BAJA | 3-5 días | expo-file-system |

### Costo Total Estimado: **22-29 días**

---

## 🚀 Plan de Implementación Recomendado

### Semana 1-2: Fundamentos (Fase 1 + 2)
1. ✅ Implementar SQLCipher
2. ✅ Secure Storage para claves
3. ✅ Hashing de datos sensibles
4. ✅ Migración de datos

### Semana 3: Protección de Código (Fase 3)
5. ✅ Code obfuscation
6. ✅ ProGuard/Symbol stripping
7. ✅ Environment variables

### Semana 4-5: Seguridad Avanzada (Fase 4 - Opcional)
8. ⚪ Root/Jailbreak detection
9. ⚪ Biometric authentication
10. ⚪ Tamper detection

### Semana 6: Auditoría (Fase 5 - Opcional)
11. ⚪ Logging seguro
12. ⚪ Crash reporting

---

## 🔑 Checklist de Seguridad

Antes de lanzar a producción, verificar:

- [ ] Base de datos encriptada con SQLCipher
- [ ] Claves almacenadas en Keychain/SecureStore
- [ ] Código ofuscado en builds de producción
- [ ] No hay claves hardcoded en el código
- [ ] ProGuard habilitado (Android)
- [ ] Debug symbols stripped (iOS)
- [ ] .env en .gitignore
- [ ] SQL injection prevention implementado
- [ ] Validación de inputs en todas las entradas
- [ ] Logs no contienen información sensible
- [ ] Testing de seguridad completado
- [ ] Documentación de seguridad actualizada

---

## 📚 Recursos Adicionales

- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [SQLCipher Documentation](https://www.zetetic.net/sqlcipher/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)
- [Expo Security](https://docs.expo.dev/guides/security/)

---

## 🆘 Soporte y Mantenimiento

### Key Rotation Schedule
- Rotar encryption keys cada 90 días
- Actualizar certificates antes de expirar
- Revisar logs de seguridad semanalmente

### Actualizaciones de Seguridad
- Mantener dependencias actualizadas
- Aplicar parches de seguridad inmediatamente
- Auditoría de código cada 3 meses

---

**Última actualización:** 2025-11-08
**Versión del roadmap:** 1.0
**Autor:** Claude AI
