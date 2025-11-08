# 📋 TODO List - Water Reminder App

**Fecha de creación:** 2025-11-08
**Última actualización:** 2025-11-08

---

## 🔒 FASE 1: IMPLEMENTACIÓN DE SEGURIDAD (CRÍTICO)

### 1.1 SQLCipher - Encriptación de Base de Datos
- [ ] **1.1.1** Instalar dependencias de SQLCipher
  ```bash
  npm install @journeyapps/react-native-sqlcipher-2
  npx pod-install
  ```

- [ ] **1.1.2** Crear servicio de gestión de claves
  - [ ] Archivo: `src/services/EncryptionKeyManager.js`
  - [ ] Método: `generateSecureKey()`
  - [ ] Método: `getOrCreateKey()`
  - [ ] Método: `rotateKey()`

- [ ] **1.1.3** Actualizar DatabaseService para usar SQLCipher
  - [ ] Modificar `initialize()` para aceptar encryption key
  - [ ] Implementar apertura de BD con encriptación
  - [ ] Agregar método `migrateToEncrypted()`

- [ ] **1.1.4** Testing de encriptación
  - [ ] Verificar que BD se crea encriptada
  - [ ] Probar apertura sin clave (debe fallar)
  - [ ] Probar migración de datos existentes

### 1.2 SecureStore - Almacenamiento Seguro
- [ ] **1.2.1** Instalar expo-secure-store
  ```bash
  npx expo install expo-secure-store
  ```

- [ ] **1.2.2** Crear SecureStorageService
  - [ ] Archivo: `src/services/SecureStorageService.js`
  - [ ] Método: `setItem(key, value)`
  - [ ] Método: `getItem(key)`
  - [ ] Método: `deleteItem(key)`

- [ ] **1.2.3** Migrar almacenamiento de claves sensibles
  - [ ] Mover encryption key a SecureStore
  - [ ] Verificar acceso seguro

### 1.3 Hashing y Validación
- [ ] **1.3.1** Instalar expo-crypto
  ```bash
  npx expo install expo-crypto
  ```

- [ ] **1.3.2** Crear utilidades de crypto
  - [ ] Archivo: `src/utils/crypto.js`
  - [ ] Función: `hashData(data)` - SHA-256
  - [ ] Función: `hashWithSalt(data, salt)` - SHA-512
  - [ ] Función: `generateSalt()`
  - [ ] Función: `verifyIntegrity(data, hash)`

- [ ] **1.3.3** Implementar validación de inputs
  - [ ] Archivo: `src/utils/validation.js`
  - [ ] Función: `sanitizeInput(input)`
  - [ ] Función: `validateWaterAmount(amount)`
  - [ ] Función: `validateContainerData(data)`

- [ ] **1.3.4** Agregar prepared statements en todas las queries
  - [ ] Revisar DatabaseService.js
  - [ ] Reemplazar string concatenation por placeholders
  - [ ] Testing de SQL injection prevention

### 1.4 Detección de Integridad
- [ ] **1.4.1** Crear TamperDetectionService
  - [ ] Archivo: `src/services/TamperDetectionService.js`
  - [ ] Método: `generateChecksum()`
  - [ ] Método: `verifyIntegrity()`
  - [ ] Implementar verificación al inicio de app

---

## 🎨 FASE 2: NUEVAS PANTALLAS Y FUNCIONALIDADES

### 2.1 Pantalla de Share (Compartir Progreso)
- [ ] **2.1.1** Crear ShareScreen
  - [ ] Archivo: `src/components/ShareScreen.js`
  - [ ] Diseño de UI para compartir
  - [ ] Estadísticas a mostrar: racha, meta alcanzada, total del día

- [ ] **2.1.2** Implementar generación de imagen para compartir
  - [ ] Instalar `react-native-view-shot`
  ```bash
  npm install react-native-view-shot
  ```
  - [ ] Crear componente ShareCard
  - [ ] Diseño atractivo con gradientes y stats

- [ ] **2.1.3** Implementar funcionalidad de compartir
  - [ ] Instalar expo-sharing
  ```bash
  npx expo install expo-sharing
  ```
  - [ ] Método: `shareToSocial()`
  - [ ] Opciones: Instagram, Facebook, Twitter, WhatsApp
  - [ ] Guardar imagen en galería

- [ ] **2.1.4** Templates de compartir
  - [ ] Template "Daily Achievement"
  - [ ] Template "Weekly Summary"
  - [ ] Template "Streak Milestone"
  - [ ] Permitir personalización de colores/texto

### 2.2 Pantalla de Challenges (Retos)
- [ ] **2.2.1** Crear ChallengesScreen
  - [ ] Archivo: `src/components/ChallengesScreen.js`
  - [ ] Diseño estilo WaterMinder
  - [ ] Lista de retos activos y completados

- [ ] **2.2.2** Crear servicio de Challenges
  - [ ] Archivo: `src/services/ChallengesService.js`
  - [ ] Definir estructura de retos en BD
  - [ ] Tabla: `challenges` (id, name, description, goal, duration, start_date, end_date, completed)
  - [ ] Tabla: `challenge_progress` (challenge_id, date, progress, completed)

- [ ] **2.2.3** Implementar tipos de retos
  - [ ] **Reto 1:** "7-Day Hydration Streak" - Alcanzar meta 7 días seguidos
  - [ ] **Reto 2:** "Early Bird" - Tomar agua antes de 9 AM por 5 días
  - [ ] **Reto 3:** "Consistency King" - Tomar agua cada 2 horas por 3 días
  - [ ] **Reto 4:** "Weekend Warrior" - No romper racha en fin de semana
  - [ ] **Reto 5:** "2L Champion" - Tomar 2L+ por 7 días
  - [ ] **Reto 6:** "Month Master" - Alcanzar meta todos los días del mes

- [ ] **2.2.4** Sistema de recompensas/badges
  - [ ] Crear componente Badge
  - [ ] Diseños de insignias (oro, plata, bronce)
  - [ ] Almacenar badges en BD
  - [ ] Mostrar badges en perfil/stats

- [ ] **2.2.5** Notificaciones de retos
  - [ ] Notificación al completar reto
  - [ ] Recordatorio de reto activo
  - [ ] Notificación de progreso (50%, 75%)

### 2.3 Actualizar Navegación
- [ ] **2.3.1** Modificar AppNavigator.js
  - [ ] Agregar tab "Share" con ícono de compartir
  - [ ] Agregar tab "Challenges" con ícono de trofeo
  - [ ] Reorganizar orden: Home, Stats, Challenges, Share, Settings

- [ ] **2.3.2** Configurar íconos
  - [ ] Home: `water-outline`
  - [ ] Stats: `analytics-outline`
  - [ ] Challenges: `trophy-outline`
  - [ ] Share: `share-social-outline`
  - [ ] Settings: `settings-outline`

- [ ] **2.3.3** Ajustar estilos de navegación
  - [ ] Colores consistentes con tema
  - [ ] Active/Inactive states
  - [ ] Badge counts (si aplica)

---

## ⚙️ FASE 3: MEJORAS EN SETTINGS

### 3.1 Sección de Tips de Hidratación
- [ ] **3.1.1** Crear componente HydrationTips
  - [ ] Archivo: `src/components/HydrationTipsSection.js`
  - [ ] Diseño: Cards rectangulares clickeables
  - [ ] Colores variados por categoría

- [ ] **3.1.2** Crear servicio de Tips
  - [ ] Archivo: `src/services/HydrationTipsService.js`
  - [ ] Base de datos de tips en JSON
  - [ ] Categorías: Salud, Rendimiento, Consejos, Mitos

- [ ] **3.1.3** Implementar tips
  - [ ] **Tip 1:** "¿Cuánta agua necesitas?"
    - Calculadora: peso × 35ml
    - Factores: ejercicio, clima, salud

  - [ ] **Tip 2:** "Beneficios de la hidratación"
    - Mejora concentración
    - Ayuda digestión
    - Piel saludable
    - Regula temperatura

  - [ ] **Tip 3:** "Señales de deshidratación"
    - Sed excesiva
    - Orina oscura
    - Fatiga
    - Mareos

  - [ ] **Tip 4:** "Mejor momento para beber agua"
    - Al despertar
    - Antes de comidas
    - Después de ejercicio
    - Antes de dormir

  - [ ] **Tip 5:** "Mitos sobre hidratación"
    - "8 vasos al día" no es para todos
    - Café no deshidrata (en moderación)
    - No esperes a tener sed

  - [ ] **Tip 6:** "Hidratación y ejercicio"
    - Antes: 500ml, 2h antes
    - Durante: 200ml cada 15-20min
    - Después: 150% del peso perdido

- [ ] **3.1.4** Modal de detalles
  - [ ] Expandir tip al hacer click
  - [ ] Mostrar información completa
  - [ ] Imágenes/ilustraciones
  - [ ] Botón "Marcar como leído"

- [ ] **3.1.5** Calculadora de agua recomendada
  - [ ] Input: peso, nivel de actividad, clima
  - [ ] Output: ml recomendados
  - [ ] Botón "Establecer como meta"

### 3.2 Reorganizar Settings Screen
- [ ] **3.2.1** Secciones actuales (arriba)
  - [ ] Daily Goal
  - [ ] Units (ml/oz)
  - [ ] Notifications
  - [ ] Containers

- [ ] **3.2.2** Nueva sección "Resources" (abajo)
  - [ ] Título: "Learn More"
  - [ ] Grid de tips rectangulares
  - [ ] 2 columnas en móvil
  - [ ] Scroll horizontal si es necesario

- [ ] **3.2.3** Estilos
  - [ ] Cards con gradientes sutiles
  - [ ] Íconos representativos
  - [ ] Sombras y elevation
  - [ ] Animación al tocar

---

## 🗄️ FASE 4: BASE DE DATOS - NUEVAS TABLAS

### 4.1 Tabla de Challenges
- [ ] **4.1.1** Crear migración para tabla `challenges`
  ```sql
  CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL, -- 'streak', 'daily_amount', 'frequency'
    goal_value INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    icon TEXT,
    color TEXT,
    reward_badge TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **4.1.2** Crear tabla `user_challenges`
  ```sql
  CREATE TABLE IF NOT EXISTS user_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed'
    progress INTEGER DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id)
  );
  ```

- [ ] **4.1.3** Crear tabla `badges`
  ```sql
  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    earned_at DATETIME,
    challenge_id TEXT,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id)
  );
  ```

### 4.2 Tabla de Tips
- [ ] **4.2.1** Crear tabla `hydration_tips`
  ```sql
  CREATE TABLE IF NOT EXISTS hydration_tips (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    full_content TEXT,
    category TEXT, -- 'health', 'performance', 'tips', 'myths'
    icon TEXT,
    color TEXT,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **4.2.2** Seed de tips predefinidos
  - [ ] Insertar 10-15 tips iniciales
  - [ ] Categorizar correctamente

### 4.3 Métodos del DatabaseService
- [ ] **4.3.1** Challenges
  - [ ] `getChallenges()` - Listar todos
  - [ ] `getActiveChallenges()` - Activos
  - [ ] `startChallenge(challengeId)` - Iniciar
  - [ ] `updateChallengeProgress(id, progress)` - Actualizar
  - [ ] `completeChallenge(id)` - Completar
  - [ ] `failChallenge(id)` - Fallar/abandonar

- [ ] **4.3.2** Badges
  - [ ] `getBadges()` - Todos los badges
  - [ ] `getEarnedBadges()` - Solo ganados
  - [ ] `awardBadge(badgeId)` - Otorgar badge

- [ ] **4.3.3** Tips
  - [ ] `getHydrationTips()` - Todos
  - [ ] `getTipsByCategory(category)` - Por categoría
  - [ ] `markTipAsRead(tipId)` - Marcar leído
  - [ ] `getUnreadTipsCount()` - Contador

---

## 🎨 FASE 5: COMPONENTES REUTILIZABLES

### 5.1 Componentes de UI
- [ ] **5.1.1** BadgeComponent
  - [ ] Archivo: `src/components/ui/Badge.js`
  - [ ] Props: icon, color, name, earned
  - [ ] Animación de unlock

- [ ] **5.1.2** ChallengeCard
  - [ ] Archivo: `src/components/ui/ChallengeCard.js`
  - [ ] Props: challenge, progress, onPress
  - [ ] Barra de progreso
  - [ ] Estado visual (active/completed/failed)

- [ ] **5.1.3** TipCard
  - [ ] Archivo: `src/components/ui/TipCard.js`
  - [ ] Props: title, icon, color, onPress
  - [ ] Badge "New" si no leído

- [ ] **5.1.4** ProgressCircle
  - [ ] Archivo: `src/components/ui/ProgressCircle.js`
  - [ ] Reutilizable para challenges
  - [ ] Props: percentage, size, color

- [ ] **5.1.5** ShareCard
  - [ ] Archivo: `src/components/ui/ShareCard.js`
  - [ ] Template para imagen compartible
  - [ ] Variantes: daily, weekly, streak

### 5.2 Modales
- [ ] **5.2.1** ChallengeDetailModal
  - [ ] Mostrar detalles completos del reto
  - [ ] Progreso actual
  - [ ] Recompensa
  - [ ] Botón "Start Challenge" o "Continue"

- [ ] **5.2.2** TipDetailModal
  - [ ] Contenido completo del tip
  - [ ] Imágenes ilustrativas
  - [ ] Botón "Got it"

- [ ] **5.2.3** BadgeUnlockedModal
  - [ ] Animación celebratoria
  - [ ] Mostrar badge ganado
  - [ ] Compartir logro

---

## 🔧 FASE 6: FEATURES ADICIONALES

### 6.1 Sistema de Logros Automáticos
- [ ] **6.1.1** Detectar logros al registrar agua
  - [ ] Primera vez alcanzando meta
  - [ ] Racha de 7 días
  - [ ] Racha de 30 días
  - [ ] 100L total consumido
  - [ ] 1000 registros totales

- [ ] **6.1.2** Notificaciones de logros
  - [ ] Mostrar badge desbloqueado
  - [ ] Sonido/haptic feedback
  - [ ] Opción de compartir

### 6.2 Compartir Mejorado
- [ ] **6.2.1** Opciones de compartir
  - [ ] Compartir solo texto
  - [ ] Compartir imagen generada
  - [ ] Copiar al portapapeles
  - [ ] Guardar en galería

- [ ] **6.2.2** Personalización
  - [ ] Elegir tema de imagen (claro/oscuro)
  - [ ] Elegir estadística destacada
  - [ ] Agregar mensaje personalizado

### 6.3 Calculadora de Hidratación
- [ ] **6.3.1** Inputs
  - [ ] Peso (kg/lbs)
  - [ ] Nivel de actividad (sedentario/moderado/activo/muy activo)
  - [ ] Clima (frío/templado/caluroso)
  - [ ] Embarazo/lactancia (opcional)

- [ ] **6.3.2** Cálculo
  - [ ] Fórmula base: peso × 35ml
  - [ ] Ajustes por actividad: +500ml a +1500ml
  - [ ] Ajustes por clima: +200ml a +500ml
  - [ ] Ajustes especiales: +700ml (embarazo)

- [ ] **6.3.3** Resultado
  - [ ] Mostrar rango recomendado
  - [ ] Explicación del cálculo
  - [ ] Botón "Set as my goal"

---

## 🧪 FASE 7: TESTING Y CALIDAD

### 7.1 Testing de Seguridad
- [ ] **7.1.1** Encriptación
  - [ ] BD no se puede abrir sin clave
  - [ ] Key rotation funciona
  - [ ] Migración de datos correcta

- [ ] **7.1.2** Validación
  - [ ] SQL injection tests
  - [ ] Input sanitization
  - [ ] Boundary tests (valores límite)

### 7.2 Testing de Funcionalidades
- [ ] **7.2.1** Challenges
  - [ ] Iniciar challenge
  - [ ] Progreso se actualiza correctamente
  - [ ] Completar challenge otorga badge
  - [ ] Challenge fallido se marca correctamente

- [ ] **7.2.2** Share
  - [ ] Generación de imagen
  - [ ] Compartir en redes sociales
  - [ ] Guardar en galería

- [ ] **7.2.3** Tips
  - [ ] Mostrar tips
  - [ ] Marcar como leído
  - [ ] Filtrar por categoría

### 7.3 Performance
- [ ] **7.3.1** Optimizaciones de BD
  - [ ] Índices en tablas nuevas
  - [ ] Queries optimizadas
  - [ ] Batch operations donde aplique

- [ ] **7.3.2** UI Performance
  - [ ] Lazy loading de imágenes
  - [ ] Virtualized lists
  - [ ] Memoization de componentes

---

## 📱 FASE 8: UX/UI POLISH

### 8.1 Animaciones
- [ ] **8.1.1** Transiciones de pantalla
  - [ ] Fade in/out suave
  - [ ] Slide animations

- [ ] **8.1.2** Micro-interacciones
  - [ ] Botones con feedback visual
  - [ ] Loading states
  - [ ] Success/error animations

- [ ] **8.1.3** Badge unlock animation
  - [ ] Confetti effect
  - [ ] Scale up animation
  - [ ] Haptic feedback

### 8.2 Accesibilidad
- [ ] **8.2.1** Labels
  - [ ] Accessibility labels en todos los botones
  - [ ] Semantic HTML/components

- [ ] **8.2.2** Contraste
  - [ ] Verificar ratios de contraste
  - [ ] Modo oscuro compatible

### 8.3 Responsive Design
- [ ] **8.3.1** Diferentes tamaños de pantalla
  - [ ] iPhone SE (pequeño)
  - [ ] iPhone 14 (normal)
  - [ ] iPhone 14 Pro Max (grande)
  - [ ] iPad (tablet)

---

## 🚀 FASE 9: BUILD Y DEPLOYMENT

### 9.1 Configuración de Build
- [ ] **9.1.1** Android
  - [ ] ProGuard configurado
  - [ ] Keystore generado
  - [ ] Build de release

- [ ] **9.1.2** iOS
  - [ ] Certificates y provisioning profiles
  - [ ] Build de release
  - [ ] Archive y upload

### 9.2 App Stores
- [ ] **9.2.1** Google Play Store
  - [ ] Descripción
  - [ ] Screenshots
  - [ ] Privacy policy
  - [ ] Upload APK/AAB

- [ ] **9.2.2** Apple App Store
  - [ ] Descripción
  - [ ] Screenshots
  - [ ] Privacy policy
  - [ ] Upload IPA

---

## 📊 RESUMEN DE FASES

| Fase | Descripción | Prioridad | Tiempo Estimado |
|------|-------------|-----------|-----------------|
| **1** | Seguridad | 🔴 CRÍTICA | 5-7 días |
| **2** | Nuevas Pantallas | 🟡 ALTA | 4-6 días |
| **3** | Settings + Tips | 🟡 ALTA | 2-3 días |
| **4** | Base de Datos | 🟡 ALTA | 1-2 días |
| **5** | Componentes | 🟢 MEDIA | 2-3 días |
| **6** | Features Extra | 🟢 MEDIA | 3-4 días |
| **7** | Testing | 🔴 CRÍTICA | 2-3 días |
| **8** | Polish | 🔵 BAJA | 2-3 días |
| **9** | Deployment | 🟡 ALTA | 1-2 días |

**TOTAL ESTIMADO: 22-33 días de desarrollo**

---

## ✅ PROGRESO ACTUAL

### Completado
- [x] Eliminación de soporte web
- [x] Roadmap de seguridad creado
- [x] HomeScreen implementado
- [x] StatsScreen implementado
- [x] DatabaseService funcionando

### En Progreso
- [ ] Implementación de seguridad

### Pendiente
- [ ] Todo lo demás según este TODO

---

**Próximo paso:** Comenzar con Fase 1 - Implementación de seguridad
