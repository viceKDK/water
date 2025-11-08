# Explicación: ¿Por qué hay dos archivos de base de datos?

## Archivos involucrados

1. **`src/services/DatabaseService.js`** - Base de datos para móviles (iOS/Android)
2. **`src/services/DatabaseService.web.js`** - Base de datos para web (navegador)

## ¿Por qué existen dos versiones?

Expo permite que tu aplicación se ejecute en **múltiples plataformas**:
- 📱 iOS
- 🤖 Android
- 🌐 Web (navegador)

El problema es que **SQLite no funciona en navegadores web**. Por eso necesitamos dos implementaciones:

### DatabaseService.js (Móviles)
- Usa `expo-sqlite` (base de datos nativa)
- Almacena datos en archivos SQLite
- Más potente y eficiente
- Solo funciona en iOS/Android

### DatabaseService.web.js (Web)
- Usa `localStorage` (API del navegador)
- Almacena datos en formato JSON
- Menos potente pero funciona en web
- Emula la API de SQLite

## ¿Tu app es solo para móvil?

Sí, en ese caso **no necesitas la versión web**, pero no hace daño tenerla porque:

1. Permite probar la app en el navegador durante desarrollo
2. Facilita debugging en computadora
3. Da flexibilidad para futuro

Si quieres eliminar el soporte web, podrías:
- Borrar `DatabaseService.web.js`
- Simplificar el código en `AppContext.js` para solo usar la versión nativa

## Cómo funciona la selección automática

En `src/context/AppContext.js` (líneas 5-12):

```javascript
let DatabaseService, NotificationService;
if (Platform.OS === 'web') {
  DatabaseService = require('../services/DatabaseService.web.js').default;
  NotificationService = require('../services/NotificationService.web.js').default;
} else {
  DatabaseService = require('../services/DatabaseService.js').default;
  NotificationService = require('../services/NotificationService.js').default;
}
```

React Native detecta automáticamente en qué plataforma se está ejecutando y carga el archivo apropiado.

## Estado actual

✅ **Home Screen** - Completamente implementado (502 líneas)
✅ **Stats Screen** - Completamente implementado (680 líneas)
✅ **DatabaseService.js** - Todos los métodos necesarios
✅ **DatabaseService.web.js** - Todos los métodos necesarios

## Si la app se queda en "Loading..."

Esto puede deberse a:

1. **Primera ejecución**: La base de datos SQLite se está creando por primera vez
2. **Error de inicialización**: Revisa la consola de Expo para ver errores
3. **Permisos**: En algunos casos SQLite necesita permisos especiales
4. **Cache corrupto**: Intenta limpiar el cache con `npx expo start --clear`

### Solución de problemas:

```bash
# 1. Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install

# 2. Ejecutar con logs detallados
npx expo start --clear

# 3. Si estás en Expo Go, asegúrate de tener la versión correcta
# SDK 54 requiere Expo Go actualizado
```

## Métodos disponibles en ambas versiones

Todos estos métodos existen y funcionan en AMBAS versiones:

- ✅ `initialize()` - Inicializar BD
- ✅ `logWaterIntake()` - Registrar consumo
- ✅ `getDailyIntake()` - Obtener consumo diario
- ✅ `getHourlyIntake()` - Datos por hora
- ✅ `getWeeklyIntake()` - Datos semanales
- ✅ `getMonthlyIntake()` - Datos mensuales
- ✅ `getStreakDays()` - Racha de días
- ✅ `getAllContainers()` - Todos los contenedores
- ✅ `getSetting()` - Obtener configuración
- ✅ `setSetting()` - Guardar configuración
- ✅ `updateSettings()` - Actualizar configuración
- ✅ `addContainer()` / `createContainer()` - Agregar contenedor
- ✅ `updateContainer()` - Actualizar contenedor
- ✅ `deleteContainer()` - Eliminar contenedor

---

**Conclusión**: La app está completamente implementada. Si hay problemas de loading, es un issue de configuración/inicialización, no de código faltante.
