# WaterMinder Personal

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)
![Framework](https://img.shields.io/badge/framework-Expo%20(React%20Native)-4630EB.svg)

Una aplicación personal de seguimiento de hidratación inspirada en WaterMinder, diseñada para ser simple, visual y enfocada en la privacidad de los datos mediante un enfoque **offline-first**.

---

## 🚀 Características Principales

- **Visualización Corporal Intuitiva**: Una representación gráfica que se "llena" progresivamente conforme registras tu consumo de agua.
- **Registro Rápido**: Templates de recipientes comunes (vaso 250ml, botella 500ml, etc.) para registrar con un solo toque.
- **Personalización Total**: Crea tus propios recipientes con cantidades específicas.
- **Estadísticas Detalladas**: Visualiza tu progreso por día, semana y mes.
- **Metas Dinámicas**: Establece y ajusta tu objetivo diario de hidratación.
- **Recordatorios Inteligentes**: Notificaciones locales configurables para mantenerte hidratado.
- **100% Offline**: Todos tus datos permanecen en tu dispositivo mediante SQLite.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Base de Datos**: [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (expo-sqlite)
- **Gráficos**: [react-native-svg](https://github.com/software-mansion/react-native-svg) & [react-native-circular-progress](https://github.com/bartgryszko/react-native-circular-progress)
- **Estado**: React Context API + useReducer
- **Notificaciones**: [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- **Almacenamiento Seguro**: [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/secure-store/)

---

## 📂 Estructura del Proyecto

```text
src/
├── components/   # Pantallas y componentes de UI (Home, Stats, Settings, etc.)
├── context/      # Gestión de estado global (AppContext)
├── navigation/   # Configuración de rutas (AppNavigator)
├── services/     # Lógica de negocio (Database, Notifications, SecureStorage)
└── utils/        # Funciones de ayuda (Crypto, Validation)
```

---

## ⚙️ Instalación y Uso

### Requisitos Previos
- Node.js (v18+)
- npm o yarn
- Expo Go (en tu dispositivo móvil) o un emulador configurado

### Configuración
1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```

---

## 🔒 Seguridad y Privacidad

La aplicación está diseñada siguiendo un [Roadmap de Seguridad](./SECURITY_ROADMAP.md) que incluye:
- **Encriptación**: Implementación futura de SQLCipher para la base de datos local.
- **Almacenamiento Seguro**: Uso de Keychain/SecureStore para datos sensibles.
- **Ofuscación**: Protección del código fuente en builds de producción.
- **Validación**: Prevención de SQL Injection y saneamiento de entradas.

---

## 📄 Documentación Adicional

- [Product Requirements Document (PRD)](./docs/prd.md)
- [Explicación de la Base de Datos](./DATABASE_EXPLANATION.md)
- [Roadmap de Seguridad](./SECURITY_ROADMAP.md)
- [Especificaciones Frontend](./docs/front-end-spec.md)

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [package.json](./package.json) para más detalles.
