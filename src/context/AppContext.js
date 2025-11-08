import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Import native services (mobile only - no web support)
import DatabaseService from '../services/DatabaseService';
import NotificationService from '../services/NotificationService';

// Import security services
import EncryptionKeyManager from '../services/EncryptionKeyManager';
import TamperDetectionService from '../services/TamperDetectionService';

// Initial state
const initialState = {
  // Water intake data
  currentIntake: 0,
  dailyGoal: 2000,
  todayEntries: [],
  
  // Settings
  settings: {
    notificationsEnabled: true,
    notificationStartTime: '08:00',
    notificationEndTime: '22:00',
    notificationFrequency: 'sixty',
    units: 'metric',
    theme: 'light',
  },
  
  // Containers
  containers: [],
  
  // Statistics
  stats: {
    streak: 0,
    weeklyData: [],
    monthlyData: [],
    hourlyData: new Array(24).fill(0),
  },
  
  // UI state
  loading: true,
  error: null,
};

// Action types
const ActionTypes = {
  // Data loading
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  
  // Water intake
  SET_CURRENT_INTAKE: 'SET_CURRENT_INTAKE',
  SET_DAILY_GOAL: 'SET_DAILY_GOAL',
  ADD_WATER_ENTRY: 'ADD_WATER_ENTRY',
  SET_TODAY_ENTRIES: 'SET_TODAY_ENTRIES',
  
  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_SETTINGS: 'SET_SETTINGS',
  
  // Containers
  SET_CONTAINERS: 'SET_CONTAINERS',
  ADD_CONTAINER: 'ADD_CONTAINER',
  UPDATE_CONTAINER: 'UPDATE_CONTAINER',
  DELETE_CONTAINER: 'DELETE_CONTAINER',
  
  // Statistics
  SET_STATS: 'SET_STATS',
  UPDATE_STREAK: 'UPDATE_STREAK',
  SET_HOURLY_DATA: 'SET_HOURLY_DATA',
  
  // Initialize
  INITIALIZE_APP: 'INITIALIZE_APP',
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
      
    case ActionTypes.SET_CURRENT_INTAKE:
      return {
        ...state,
        currentIntake: action.payload,
      };
      
    case ActionTypes.SET_DAILY_GOAL:
      return {
        ...state,
        dailyGoal: action.payload,
      };
      
    case ActionTypes.ADD_WATER_ENTRY:
      return {
        ...state,
        currentIntake: state.currentIntake + action.payload.amount,
        todayEntries: [...state.todayEntries, action.payload],
      };
      
    case ActionTypes.SET_TODAY_ENTRIES:
      return {
        ...state,
        todayEntries: action.payload,
      };
      
    case ActionTypes.SET_SETTINGS:
      return {
        ...state,
        settings: action.payload,
      };
      
    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
      
    case ActionTypes.SET_CONTAINERS:
      return {
        ...state,
        containers: action.payload,
      };
      
    case ActionTypes.ADD_CONTAINER:
      return {
        ...state,
        containers: [...state.containers, action.payload],
      };
      
    case ActionTypes.UPDATE_CONTAINER:
      return {
        ...state,
        containers: state.containers.map(container =>
          container.id === action.payload.id
            ? { ...container, ...action.payload.updates }
            : container
        ),
      };
      
    case ActionTypes.DELETE_CONTAINER:
      return {
        ...state,
        containers: state.containers.filter(container => container.id !== action.payload),
      };
      
    case ActionTypes.SET_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload,
        },
      };
      
    case ActionTypes.UPDATE_STREAK:
      return {
        ...state,
        stats: {
          ...state.stats,
          streak: action.payload,
        },
      };
      
    case ActionTypes.SET_HOURLY_DATA:
      return {
        ...state,
        stats: {
          ...state.stats,
          hourlyData: action.payload,
        },
      };
      
    case ActionTypes.INITIALIZE_APP:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
      };
      
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app data
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      // Initialize security services
      console.log('🔐 Initializing security services...');
      await EncryptionKeyManager.initialize();
      await TamperDetectionService.initialize();

      // Verify data integrity
      const integrityCheck = await TamperDetectionService.verifyDataIntegrity();
      if (!integrityCheck.isValid) {
        console.warn('⚠️ Data integrity check failed:', integrityCheck.message);
        // Opcional: mostrar advertencia al usuario
      }

      // Initialize database
      await DatabaseService.initialize();

      // Load initial data (native SQLite only)
      const dailyIntake = await DatabaseService.getDailyIntake();

      const containers = await DatabaseService.getAllContainers();

      const settings = {
        dailyGoal: await DatabaseService.getSetting('dailyGoal', 2000),
        notificationsEnabled: Boolean(await DatabaseService.getSetting('notificationsEnabled', true)),
        notificationStartTime: await DatabaseService.getSetting('notificationStartTime', '08:00'),
        notificationEndTime: await DatabaseService.getSetting('notificationEndTime', '22:00'),
        notificationFrequency: await DatabaseService.getSetting('notificationFrequency', 'sixty'),
        unit: await DatabaseService.getSetting('unit', 'ml')
      };

      dispatch({
        type: ActionTypes.INITIALIZE_APP,
        payload: {
          currentIntake: dailyIntake,
          dailyGoal: settings.dailyGoal || 2000,
          containers: containers,
          settings: settings,
          todayEntries: [],
          stats: {
            ...initialState.stats,
            streak: 0,
          },
        },
      });

    } catch (error) {
      console.error('Failed to initialize app:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Simplified - settings are now handled directly by the service

  // Action creators
  const actions = {
    // Water intake actions
    logWater: async (amount, containerId = null) => {
      try {
        const entry = await DatabaseService.logWaterIntake(amount, containerId);
        
        dispatch({
          type: ActionTypes.ADD_WATER_ENTRY,
          payload: {
            amount,
            containerId,
            timestamp: new Date().toISOString(),
          },
        });

      } catch (error) {
        console.error('Failed to log water:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    setDailyGoal: async (goalAmount) => {
      try {
        // Update in database (native only)
        await DatabaseService.setSetting('dailyGoal', goalAmount);

        dispatch({
          type: ActionTypes.SET_DAILY_GOAL,
          payload: goalAmount,
        });
      } catch (error) {
        console.error('Failed to set daily goal:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    // Settings actions
    updateSettings: async (newSettings) => {
      try {
        // Update each setting individually (native SQLite only)
        for (const [key, value] of Object.entries(newSettings)) {
          await DatabaseService.setSetting(key, value);
        }

        dispatch({
          type: ActionTypes.UPDATE_SETTINGS,
          payload: newSettings,
        });

        // Update checksum after settings modification
        await TamperDetectionService.updateChecksum();
      } catch (error) {
        console.error('Failed to update settings:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    // Container actions
    addContainer: async (containerData) => {
      try {
        // Native SQLite only
        const containerId = await DatabaseService.createContainer(
          containerData.name,
          containerData.volume,
          containerData.type,
          containerData.color,
          containerData.isCustom
        );
        const newContainer = { ...containerData, id: containerId };
        dispatch({
          type: ActionTypes.ADD_CONTAINER,
          payload: newContainer,
        });

        // Update checksum after data modification
        await TamperDetectionService.updateChecksum();

        return containerId;
      } catch (error) {
        console.error('Failed to add container:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    updateContainer: async (containerId, updates) => {
      try {
        await DatabaseService.updateContainer(containerId, updates);
        
        dispatch({
          type: ActionTypes.UPDATE_CONTAINER,
          payload: { id: containerId, updates },
        });
      } catch (error) {
        console.error('Failed to update container:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    deleteContainer: async (containerId) => {
      try {
        await DatabaseService.deleteContainer(containerId);
        
        dispatch({
          type: ActionTypes.DELETE_CONTAINER,
          payload: containerId,
        });
      } catch (error) {
        console.error('Failed to delete container:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    // Statistics actions
    loadStats: async (period, date) => {
      try {
        const stats = await DatabaseService.getStatistics(period, date);
        dispatch({
          type: ActionTypes.SET_STATS,
          payload: { [period + 'Data']: stats },
        });
        return stats;
      } catch (error) {
        console.error('Failed to load stats:', error);
        return null;
      }
    },

    // Utility actions
    refreshData: async () => {
      await initializeApp();
    },

    resetAllData: async () => {
      try {
        // Reset SQLite database (native only)
        await DatabaseService.resetAllData();
        await initializeApp();
      } catch (error) {
        console.error('Failed to reset data:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      }
    },

    clearError: () => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });
    },
  };

  const contextValue = {
    ...state,
    ...actions,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;