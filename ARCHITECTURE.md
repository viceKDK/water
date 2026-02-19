# Arquitectura del Proyecto - WaterMinder Personal

Este documento describe la arquitectura y estructura del proyecto para facilitar la localización de la lógica de simulación, la UI y la gestión de datos.

## 🗺️ Estructura de Carpetas

```text
/
├── assets/             # Recursos estáticos (iconos, imágenes)
├── docs/               # Documentación detallada (PRD, Specs)
├── src/
│   ├── components/     # Componentes de UI y Pantallas
│   │   ├── HomeScreen.js       # Registro rápido y visualización corporal
│   │   ├── StatsScreen.js      # Gráficos y métricas históricas
│   │   └── ...                 # Otras vistas (Settings, Challenges, etc.)
│   ├── context/        # Gestión de Estado
│   │   └── AppContext.js       # Contexto global para hidratación y configuración
│   ├── navigation/     # Navegación
│   │   └── AppNavigator.js     # Configuración de Tabs y Stack Navigation
│   ├── services/       # Lógica de Negocio y Servicios
│   │   ├── DatabaseService.js  # Abstracción de SQLite para persistencia
│   │   ├── NotificationService.js # Gestión de recordatorios locales
│   │   ├── SecureStorageService.js # Almacenamiento de claves y datos sensibles
│   │   └── EncryptionKeyManager.js # Gestión de claves para seguridad
│   └── utils/          # Utilidades
│       ├── crypto.js           # Operaciones criptográficas
│       └── validation.js       # Validación y saneamiento de datos
└── ... (archivos de configuración: package.json, app.json, etc.)
```

## 🧩 Flujo de Datos

1. **Persistencia Local**: La aplicación utiliza un enfoque **offline-first**. Todos los datos de consumo se almacenan en una base de datos SQLite local gestionada por `DatabaseService.js`.
2. **Estado Global**: `AppContext.js` actúa como el "single source of truth" para la UI, sincronizando los datos de la base de datos con los componentes de React mediante `useReducer`.
3. **Servicios**: Los componentes no acceden directamente a la base de datos; utilizan los servicios en `src/services/` para realizar operaciones, garantizando una separación clara de responsabilidades.

## 💧 Lógica de Hidratación

- **Registro**: Al registrar agua, se inserta una entrada en `water_intake` y se actualiza el estado global.
- **Visualización**: La "llenado" corporal se calcula en base al consumo acumulado del día vs. el objetivo (`daily_goal`) almacenado en las configuraciones.
- **Estadísticas**: `StatsScreen.js` consume agregaciones de SQL (diarias, semanales, mensuales) para generar visualizaciones mediante `react-native-svg`.

## 🔒 Seguridad

La arquitectura incluye capas de seguridad progresivas:
- **Capa de Servicio**: Abstracción de la base de datos para prevenir SQL Injection.
- **Capa de Almacenamiento**: Uso de `SecureStore` para configuraciones que requieren mayor protección.
- **Roadmap**: Se prevé la migración a una base de datos completamente encriptada.

---

**Nota**: Este archivo debe actualizarse ante cambios significativos en la estructura del código.
