import * as SQLite from 'expo-sqlite';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('💾 Database already initialized');
      return;
    }

    try {
      console.log('💾 Opening database...');
      this.db = await SQLite.openDatabaseAsync('waterminder.db');
      console.log('✅ Database opened successfully');

      console.log('📋 Creating tables...');
      await this.createTables();
      console.log('✅ Tables created successfully');

      console.log('🌱 Seeding default data...');
      await this.seedDefaultData();
      console.log('✅ Default data seeded successfully');

      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  async createTables() {
    const createTablesSQL = `
      -- Water intake logging table
      CREATE TABLE IF NOT EXISTS water_intake (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount INTEGER NOT NULL,
        container_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        date TEXT NOT NULL
      );

      -- Container templates table
      CREATE TABLE IF NOT EXISTS containers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        volume INTEGER NOT NULL,
        type TEXT NOT NULL,
        color TEXT NOT NULL,
        is_custom BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Settings storage table
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Daily goals table
      CREATE TABLE IF NOT EXISTS daily_goals (
        date TEXT PRIMARY KEY,
        goal_amount INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Challenges table
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        goal_type TEXT NOT NULL,
        goal_value INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        icon TEXT,
        color TEXT,
        reward_badge TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- User challenges table (tracking user progress)
      CREATE TABLE IF NOT EXISTS user_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        completed_at DATETIME,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id)
      );

      -- Badges table
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

      -- Hydration tips table
      CREATE TABLE IF NOT EXISTS hydration_tips (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        full_content TEXT,
        category TEXT,
        icon TEXT,
        color TEXT,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_water_intake_date ON water_intake(date);
      CREATE INDEX IF NOT EXISTS idx_water_intake_timestamp ON water_intake(timestamp);
      CREATE INDEX IF NOT EXISTS idx_containers_active ON containers(is_active);
      CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
      CREATE INDEX IF NOT EXISTS idx_badges_earned ON badges(earned_at);
      CREATE INDEX IF NOT EXISTS idx_tips_category ON hydration_tips(category);
    `;

    await this.db.execAsync(createTablesSQL);
  }

  async seedDefaultData() {
    console.log('🌱 Checking for default containers...');
    // Check if default containers already exist
    const existingContainers = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM containers WHERE is_custom = 0'
    );

    if (existingContainers.count === 0) {
      console.log('➕ Creating default containers...');
      const defaultContainers = [
        { id: 'glass-250', name: 'Glass', volume: 250, type: 'wine-outline', color: '#4A90E2' },
        { id: 'bottle-500', name: 'Bottle', volume: 500, type: 'bottle-outline', color: '#87CEEB' },
        { id: 'large-1000', name: 'Large Bottle', volume: 1000, type: 'flask-outline', color: '#4CAF50' },
      ];

      for (const container of defaultContainers) {
        await this.db.runAsync(
          'INSERT INTO containers (id, name, volume, type, color, is_custom, is_active) VALUES (?, ?, ?, ?, ?, 0, 1)',
          [container.id, container.name, container.volume, container.type, container.color]
        );
      }
      console.log('✅ Default containers created');
    } else {
      console.log('✓ Default containers already exist');
    }

    console.log('⚙️ Checking settings...');
    // Set default daily goal if not exists
    const defaultGoal = await this.getSetting('dailyGoal');
    if (!defaultGoal) {
      console.log('➕ Setting default daily goal...');
      await this.setSetting('dailyGoal', 2000);
    }

    // Set default notification settings
    const notificationsEnabled = await this.getSetting('notificationsEnabled');
    if (notificationsEnabled === null) {
      console.log('➕ Setting default notification settings...');
      await this.setSetting('notificationsEnabled', true);
      await this.setSetting('notificationStartTime', '08:00');
      await this.setSetting('notificationEndTime', '22:00');
      await this.setSetting('notificationFrequency', 'sixty');
    }
    console.log('✅ Settings configured');

    // Seed default challenges
    console.log('🏆 Seeding default challenges...');
    await this.seedDefaultChallenges();

    // Seed hydration tips
    console.log('💡 Seeding hydration tips...');
    await this.seedHydrationTips();

    // Migration: Fix old string values to proper types
    console.log('🔄 Running migrations...');
    await this.migrateOldSettings();
    console.log('✅ Migrations completed');

    console.log('✅ seedDefaultData() completed');
  }

  // Migrate old settings from string to proper types
  async migrateOldSettings() {
    try {
      // Fix notificationsEnabled if it's stored as string
      const notifEnabled = await this.getSetting('notificationsEnabled');
      if (typeof notifEnabled === 'string') {
        await this.setSetting('notificationsEnabled', notifEnabled === 'true');
      }

      // Fix dailyGoal if it's stored as string
      const goal = await this.getSetting('dailyGoal');
      if (typeof goal === 'string') {
        await this.setSetting('dailyGoal', parseInt(goal) || 2000);
      }

      // Also check for old snake_case keys and migrate them
      const oldNotifEnabled = await this.getSetting('notifications_enabled');
      if (oldNotifEnabled !== null) {
        await this.setSetting('notificationsEnabled', Boolean(oldNotifEnabled));
        // Optionally delete old key (we'll keep it for backwards compat)
      }

      const oldGoal = await this.getSetting('daily_goal');
      if (oldGoal !== null) {
        await this.setSetting('dailyGoal', parseInt(oldGoal) || 2000);
      }

      const oldStartTime = await this.getSetting('notification_start_time');
      if (oldStartTime !== null) {
        await this.setSetting('notificationStartTime', oldStartTime);
      }

      const oldEndTime = await this.getSetting('notification_end_time');
      if (oldEndTime !== null) {
        await this.setSetting('notificationEndTime', oldEndTime);
      }

      const oldFreq = await this.getSetting('notification_frequency');
      if (oldFreq !== null) {
        await this.setSetting('notificationFrequency', oldFreq);
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  // Water Intake Methods
  async logWaterIntake(amount, containerId = null) {
    if (!this.isInitialized) await this.initialize();

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const timestamp = new Date().toISOString();

    try {
      const result = await this.db.runAsync(
        'INSERT INTO water_intake (amount, container_id, timestamp, date) VALUES (?, ?, ?, ?)',
        [amount, containerId, timestamp, date]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Failed to log water intake:', error);
      throw error;
    }
  }

  async getDailyIntake(date = null) {
    if (!this.isInitialized) await this.initialize();

    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const result = await this.db.getFirstAsync(
        'SELECT COALESCE(SUM(amount), 0) as total FROM water_intake WHERE date = ?',
        [targetDate]
      );
      return result.total;
    } catch (error) {
      console.error('Failed to get daily intake:', error);
      return 0;
    }
  }

  async getWeeklyIntake(startDate, endDate) {
    if (!this.isInitialized) await this.initialize();

    try {
      console.log(`📊 Fetching weekly intake from ${startDate} to ${endDate}...`);
      const results = await this.db.getAllAsync(`
        SELECT
          date,
          COALESCE(SUM(amount), 0) as consumed,
          strftime('%w', date) as day_of_week
        FROM water_intake
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date
      `, [startDate, endDate]);
      console.log(`✅ Found ${results.length} daily records for the week`);

      return results;
    } catch (error) {
      console.error('❌ Failed to get weekly intake:', error);
      return [];
    }
  }

  async getMonthlyIntake(year, month) {
    if (!this.isInitialized) await this.initialize();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    try {
      console.log(`📊 Fetching monthly intake for ${year}-${month}...`);
      const results = await this.db.getAllAsync(`
        SELECT
          date,
          COALESCE(SUM(amount), 0) as consumed,
          CAST(strftime('%d', date) as INTEGER) as day
        FROM water_intake
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date
      `, [startDate, endDate]);
      console.log(`✅ Found ${results.length} daily records for the month`);

      return results;
    } catch (error) {
      console.error('❌ Failed to get monthly intake:', error);
      return [];
    }
  }

  async getHourlyIntake(date = null) {
    if (!this.isInitialized) await this.initialize();

    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      console.log(`📊 Fetching hourly intake for date: ${targetDate}...`);
      const results = await this.db.getAllAsync(`
        SELECT
          CAST(strftime('%H', timestamp) as INTEGER) as hour,
          COALESCE(SUM(amount), 0) as amount
        FROM water_intake
        WHERE date = ?
        GROUP BY strftime('%H', timestamp)
        ORDER BY hour
      `, [targetDate]);
      console.log(`✅ Found ${results.length} hourly records`);

      // Fill in missing hours with 0
      const hourlyData = new Array(24).fill(0);
      results.forEach(row => {
        hourlyData[row.hour] = row.amount;
      });

      return hourlyData;
    } catch (error) {
      console.error('Failed to get hourly intake:', error);
      return new Array(24).fill(0);
    }
  }

  // Container Methods
  async createContainer(name, volume, type, color, isCustom = true) {
    if (!this.isInitialized) await this.initialize();

    const id = `${isCustom ? 'custom' : 'default'}-${Date.now()}`;

    try {
      await this.db.runAsync(
        'INSERT INTO containers (id, name, volume, type, color, is_custom, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [id, name, volume, type, color, isCustom ? 1 : 0]
      );
      return id;
    } catch (error) {
      console.error('Failed to create container:', error);
      throw error;
    }
  }

  async updateContainer(id, updates) {
    if (!this.isInitialized) await this.initialize();

    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (['name', 'volume', 'type', 'color'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    try {
      await this.db.runAsync(
        `UPDATE containers SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return true;
    } catch (error) {
      console.error('Failed to update container:', error);
      throw error;
    }
  }

  async deleteContainer(id) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync('UPDATE containers SET is_active = 0 WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Failed to delete container:', error);
      throw error;
    }
  }

  async getAllContainers() {
    if (!this.isInitialized) await this.initialize();

    try {
      const containers = await this.db.getAllAsync(
        'SELECT * FROM containers WHERE is_active = 1 ORDER BY is_custom ASC, name ASC'
      );

      return containers.map(container => ({
        id: container.id,
        name: container.name,
        volume: container.volume,
        type: container.type,
        color: container.color,
        isCustom: Boolean(container.is_custom),
      }));
    } catch (error) {
      console.error('Failed to get containers:', error);
      return [];
    }
  }

  async getDefaultContainers() {
    if (!this.isInitialized) await this.initialize();

    try {
      const containers = await this.db.getAllAsync(
        'SELECT * FROM containers WHERE is_custom = 0 AND is_active = 1 ORDER BY name ASC'
      );

      return containers.map(container => ({
        id: container.id,
        name: container.name,
        volume: container.volume,
        type: container.type,
        color: container.color,
        isCustom: false,
      }));
    } catch (error) {
      console.error('Failed to get default containers:', error);
      return [];
    }
  }

  // Settings Methods
  async setSetting(key, value) {
    // Don't check isInitialized here to avoid infinite loop during initialization
    // This method is called during seedDefaultData()

    try {
      await this.db.runAsync(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [key, JSON.stringify(value)]);
      return true;
    } catch (error) {
      console.error('Failed to set setting:', error);
      throw error;
    }
  }

  async getSetting(key, defaultValue = null) {
    // Don't check isInitialized here to avoid infinite loop during initialization
    // This method is called during seedDefaultData()

    try {
      const result = await this.db.getFirstAsync(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );

      if (result) {
        return JSON.parse(result.value);
      }
      return defaultValue;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return defaultValue;
    }
  }

  async updateSettings(newSettings) {
    if (!this.isInitialized) await this.initialize();

    try {
      for (const [key, value] of Object.entries(newSettings)) {
        await this.setSetting(key, value);
      }
      return newSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  async getDailyGoal(date = null) {
    if (!this.isInitialized) await this.initialize();

    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const result = await this.db.getFirstAsync(
        'SELECT goal_amount FROM daily_goals WHERE date = ?',
        [targetDate]
      );

      if (result) {
        return result.goal_amount;
      }

      // Fallback to default setting
      const defaultGoal = await this.getSetting('dailyGoal', 2000);
      return parseInt(defaultGoal);
    } catch (error) {
      console.error('Failed to get daily goal:', error);
      return 2000;
    }
  }

  async setDailyGoal(date, amount) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(`
        INSERT OR REPLACE INTO daily_goals (date, goal_amount, created_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [date, amount]);
      return true;
    } catch (error) {
      console.error('Failed to set daily goal:', error);
      throw error;
    }
  }

  // Statistics Methods
  async getStreakDays() {
    if (!this.isInitialized) await this.initialize();

    try {
      const defaultGoal = await this.getSetting('dailyGoal', 2000);
      
      const results = await this.db.getAllAsync(`
        SELECT 
          date,
          COALESCE(SUM(amount), 0) as total
        FROM water_intake 
        WHERE date >= date('now', '-30 days')
        GROUP BY date 
        HAVING total >= ?
        ORDER BY date DESC
      `, [defaultGoal]);

      // Calculate consecutive days from today backwards
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date(today);

      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = results.find(r => r.date === dateStr);
        
        if (dayData && dayData.total >= defaultGoal) {
          streak++;
        } else {
          break;
        }

        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    } catch (error) {
      console.error('Failed to calculate streak:', error);
      return 0;
    }
  }

  async getBestDay(period = 'month') {
    if (!this.isInitialized) await this.initialize();

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "WHERE date >= date('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "WHERE date >= date('now', '-30 days')";
        break;
      case 'year':
        dateFilter = "WHERE date >= date('now', '-365 days')";
        break;
      default:
        dateFilter = "WHERE date >= date('now', '-30 days')";
    }

    try {
      const result = await this.db.getFirstAsync(`
        SELECT 
          date,
          COALESCE(SUM(amount), 0) as total
        FROM water_intake 
        ${dateFilter}
        GROUP BY date 
        ORDER BY total DESC 
        LIMIT 1
      `);

      return result || { date: null, total: 0 };
    } catch (error) {
      console.error('Failed to get best day:', error);
      return { date: null, total: 0 };
    }
  }

  async getAverageIntake(period = 'month') {
    if (!this.isInitialized) await this.initialize();

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "WHERE date >= date('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "WHERE date >= date('now', '-30 days')";
        break;
      case 'year':
        dateFilter = "WHERE date >= date('now', '-365 days')";
        break;
      default:
        dateFilter = "WHERE date >= date('now', '-30 days')";
    }

    try {
      const result = await this.db.getFirstAsync(`
        SELECT 
          AVG(daily_total) as average
        FROM (
          SELECT 
            date,
            COALESCE(SUM(amount), 0) as daily_total
          FROM water_intake 
          ${dateFilter}
          GROUP BY date
        )
      `);

      return Math.round(result?.average || 0);
    } catch (error) {
      console.error('Failed to get average intake:', error);
      return 0;
    }
  }

  // Challenges Methods
  async seedDefaultChallenges() {
    try {
      console.log('  🔍 Checking if challenges already exist...');
      // Check if challenges already exist
      const existing = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM challenges');
      console.log(`  📊 Found ${existing?.count || 0} existing challenges`);

      if (existing && existing.count > 0) {
        console.log('  ✓ Challenges already seeded');
        return; // Already seeded
      }

      console.log('  ➕ Inserting default challenges...');

      const defaultChallenges = [
        {
          id: 'streak-7',
          name: '7-Day Streak',
          description: 'Reach your daily goal for 7 consecutive days',
          goal_type: 'streak',
          goal_value: 7,
          duration_days: 7,
          icon: 'flame',
          color: '#FF6B35',
          reward_badge: 'badge-streak-7'
        },
        {
          id: 'early-bird',
          name: 'Early Bird',
          description: 'Drink water before 9 AM for 5 days',
          goal_type: 'early_morning',
          goal_value: 5,
          duration_days: 5,
          icon: 'sunny',
          color: '#FFD93D',
          reward_badge: 'badge-early-bird'
        },
        {
          id: 'consistency',
          name: 'Consistency King',
          description: 'Drink water every 2 hours for 3 days',
          goal_type: 'frequency',
          goal_value: 3,
          duration_days: 3,
          icon: 'timer',
          color: '#4A90E2',
          reward_badge: 'badge-consistency'
        },
        {
          id: 'weekend',
          name: 'Weekend Warrior',
          description: "Don't break your streak over the weekend",
          goal_type: 'weekend_streak',
          goal_value: 2,
          duration_days: 2,
          icon: 'calendar',
          color: '#9B59B6',
          reward_badge: 'badge-weekend'
        },
        {
          id: '2l-champion',
          name: '2L Champion',
          description: 'Drink 2 liters or more for 7 days',
          goal_type: 'daily_amount',
          goal_value: 2000,
          duration_days: 7,
          icon: 'trophy',
          color: '#F39C12',
          reward_badge: 'badge-2l-champion'
        },
        {
          id: 'month-master',
          name: 'Month Master',
          description: 'Reach your goal every day this month',
          goal_type: 'monthly_complete',
          goal_value: 30,
          duration_days: 30,
          icon: 'star',
          color: '#E74C3C',
          reward_badge: 'badge-month-master'
        }
      ];

      for (const challenge of defaultChallenges) {
        await this.db.runAsync(`
          INSERT OR IGNORE INTO challenges (id, name, description, goal_type, goal_value, duration_days, icon, color, reward_badge, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          challenge.id,
          challenge.name,
          challenge.description,
          challenge.goal_type,
          challenge.goal_value,
          challenge.duration_days,
          challenge.icon,
          challenge.color,
          challenge.reward_badge
        ]);
      }

      console.log(`  ✅ ${defaultChallenges.length} challenges seeded successfully`);
    } catch (error) {
      console.error('  ❌ Failed to seed default challenges:', error);
    }
  }

  async seedHydrationTips() {
    try {
      console.log('  🔍 Checking if hydration tips already exist...');
      // Check if tips already exist
      const existing = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM hydration_tips');
      console.log(`  📊 Found ${existing?.count || 0} existing tips`);

      if (existing && existing.count > 0) {
        console.log('  ✓ Hydration tips already seeded');
        return; // Already seeded
      }

      console.log('  ➕ Inserting hydration tips...');

      const defaultTips = [
        {
          id: 'tip-how-much',
          title: '¿Cuánta agua necesitas?',
          summary: 'Calcula tu ingesta diaria ideal',
          full_content: 'La cantidad de agua que necesitas depende de varios factores:\n\n• Peso: Multiplica tu peso en kg por 35ml\n• Ejercicio: Añade 500-1000ml si haces deporte\n• Clima: Añade 200-500ml en climas cálidos\n• Embarazo: Añade 300ml adicionales\n\nEjemplo: Persona de 70kg = 70 × 35 = 2,450ml al día',
          category: 'health',
          icon: 'calculator',
          color: '#4A90E2'
        },
        {
          id: 'tip-benefits',
          title: 'Beneficios de la hidratación',
          summary: 'Por qué es importante beber agua',
          full_content: 'La hidratación adecuada ayuda a:\n\n• Mejorar la concentración y memoria\n• Facilitar la digestión\n• Mantener una piel saludable\n• Regular la temperatura corporal\n• Transportar nutrientes\n• Eliminar toxinas\n• Mejorar el rendimiento físico\n• Prevenir dolores de cabeza',
          category: 'health',
          icon: 'heart',
          color: '#E74C3C'
        },
        {
          id: 'tip-dehydration',
          title: 'Señales de deshidratación',
          summary: 'Identifica cuándo necesitas agua',
          full_content: 'Síntomas de deshidratación:\n\n• Sed excesiva\n• Orina oscura o escasa\n• Fatiga o cansancio\n• Mareos o confusión\n• Boca y labios secos\n• Dolor de cabeza\n• Piel seca\n• Estreñimiento\n\nSi experimentas estos síntomas, aumenta tu consumo de agua.',
          category: 'health',
          icon: 'warning',
          color: '#F39C12'
        },
        {
          id: 'tip-when',
          title: 'Mejor momento para beber agua',
          summary: 'Optimiza tu hidratación',
          full_content: 'Momentos clave para beber agua:\n\n• Al despertar: Rehidrata tu cuerpo (500ml)\n• Antes de comidas: Ayuda a la digestión (250ml)\n• Después de ejercicio: Repone líquidos (500-1000ml)\n• Antes de dormir: Pero no demasiado (200ml)\n• Durante el día: Pequeños sorbos constantes\n\nEvita grandes cantidades de una sola vez.',
          category: 'tips',
          icon: 'time',
          color: '#9B59B6'
        },
        {
          id: 'tip-myths',
          title: 'Mitos sobre hidratación',
          summary: 'Desmintiendo falsas creencias',
          full_content: 'Mitos comunes:\n\n❌ "8 vasos al día para todos"\nRealidad: Depende de tu peso y actividad\n\n❌ "El café deshidrata"\nRealidad: Contribuye a la hidratación (con moderación)\n\n❌ "Espera a tener sed"\nRealidad: La sed indica que ya estás deshidratado\n\n❌ "Más agua es siempre mejor"\nRealidad: El exceso puede ser peligroso',
          category: 'myths',
          icon: 'information-circle',
          color: '#16A085'
        },
        {
          id: 'tip-exercise',
          title: 'Hidratación y ejercicio',
          summary: 'Guía para deportistas',
          full_content: 'Hidratación durante ejercicio:\n\n• Antes (2h): 500ml de agua\n• Durante: 200-300ml cada 15-20min\n• Después: 150% del peso perdido\n\nEjemplo: Si perdiste 500g durante ejercicio, bebe 750ml\n\nPara ejercicio intenso >1h, considera bebidas con electrolitos.',
          category: 'performance',
          icon: 'fitness',
          color: '#27AE60'
        }
      ];

      for (const tip of defaultTips) {
        await this.db.runAsync(`
          INSERT OR IGNORE INTO hydration_tips (id, title, summary, full_content, category, icon, color)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          tip.id,
          tip.title,
          tip.summary,
          tip.full_content,
          tip.category,
          tip.icon,
          tip.color
        ]);
      }

      console.log(`  ✅ ${defaultTips.length} hydration tips seeded successfully`);
    } catch (error) {
      console.error('  ❌ Failed to seed hydration tips:', error);
    }
  }

  async getChallenges() {
    if (!this.isInitialized) await this.initialize();

    try {
      console.log('🏆 Fetching available challenges...');
      const challenges = await this.db.getAllAsync(`
        SELECT * FROM challenges WHERE is_active = 1 ORDER BY created_at DESC
      `);
      console.log(`✅ Found ${challenges.length} available challenges`);
      return challenges;
    } catch (error) {
      console.error('❌ Failed to get challenges:', error);
      return [];
    }
  }

  async getUserChallenges(status = null) {
    if (!this.isInitialized) await this.initialize();

    try {
      console.log(`🏆 Fetching user challenges${status ? ` with status: ${status}` : ''}...`);
      let query = `
        SELECT uc.*, c.name, c.description, c.goal_type, c.goal_value, c.duration_days, c.icon, c.color, c.reward_badge
        FROM user_challenges uc
        JOIN challenges c ON uc.challenge_id = c.id
      `;

      if (status) {
        query += ` WHERE uc.status = ?`;
        const result = await this.db.getAllAsync(query, [status]);
        console.log(`✅ Found ${result.length} user challenges with status: ${status}`);
        return result;
      }

      const result = await this.db.getAllAsync(query);
      console.log(`✅ Found ${result.length} user challenges`);
      return result;
    } catch (error) {
      console.error('❌ Failed to get user challenges:', error);
      return [];
    }
  }

  async startChallenge(challengeId) {
    if (!this.isInitialized) await this.initialize();

    try {
      const challenge = await this.db.getFirstAsync(
        'SELECT * FROM challenges WHERE id = ?',
        [challengeId]
      );

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const result = await this.db.runAsync(`
        INSERT INTO user_challenges (challenge_id, start_date, end_date, status, progress)
        VALUES (?, ?, ?, 'active', 0)
      `, [challengeId, startDate, endDate]);

      return result.lastInsertRowId;
    } catch (error) {
      console.error('Failed to start challenge:', error);
      throw error;
    }
  }

  async updateChallengeProgress(userChallengeId, progress) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(`
        UPDATE user_challenges SET progress = ? WHERE id = ?
      `, [progress, userChallengeId]);
    } catch (error) {
      console.error('Failed to update challenge progress:', error);
      throw error;
    }
  }

  async completeChallenge(userChallengeId) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(`
        UPDATE user_challenges
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [userChallengeId]);
    } catch (error) {
      console.error('Failed to complete challenge:', error);
      throw error;
    }
  }

  async getHydrationTips(category = null) {
    if (!this.isInitialized) await this.initialize();

    try {
      if (category) {
        return await this.db.getAllAsync(
          'SELECT * FROM hydration_tips WHERE category = ? ORDER BY created_at',
          [category]
        );
      }

      return await this.db.getAllAsync(
        'SELECT * FROM hydration_tips ORDER BY created_at'
      );
    } catch (error) {
      console.error('Failed to get hydration tips:', error);
      return [];
    }
  }

  async markTipAsRead(tipId) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(
        'UPDATE hydration_tips SET read_at = CURRENT_TIMESTAMP WHERE id = ?',
        [tipId]
      );
    } catch (error) {
      console.error('Failed to mark tip as read:', error);
      throw error;
    }
  }

  async getBadges() {
    if (!this.isInitialized) await this.initialize();

    try {
      return await this.db.getAllAsync(
        'SELECT * FROM badges ORDER BY earned_at DESC'
      );
    } catch (error) {
      console.error('Failed to get badges:', error);
      return [];
    }
  }

  async awardBadge(badgeData) {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.runAsync(`
        INSERT INTO badges (id, name, description, icon, color, earned_at, challenge_id)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `, [
        badgeData.id,
        badgeData.name,
        badgeData.description,
        badgeData.icon,
        badgeData.color,
        badgeData.challenge_id || null
      ]);
    } catch (error) {
      console.error('Failed to award badge:', error);
      throw error;
    }
  }

  // Utility Methods
  async resetAllData() {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.db.execAsync(`
        DELETE FROM water_intake;
        DELETE FROM containers WHERE is_custom = 1;
        DELETE FROM settings;
        DELETE FROM daily_goals;
      `);

      await this.seedDefaultData();
      return true;
    } catch (error) {
      console.error('Failed to reset data:', error);
      throw error;
    }
  }

  async closeDatabase() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export default new DatabaseService();