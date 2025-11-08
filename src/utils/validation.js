/**
 * Validation Utilities
 *
 * Funciones para validar y sanitizar inputs de usuario.
 * Previene SQL injection, XSS y otros ataques.
 */

/**
 * Sanitizar input general removiendo caracteres peligrosos
 * @param {any} input - Input a sanitizar
 * @returns {any} - Input sanitizado
 */
export function sanitizeInput(input) {
  // Si es null o undefined, devolver como está
  if (input === null || input === undefined) {
    return input;
  }

  // Si es número o booleano, devolver como está
  if (typeof input !== 'string') {
    return input;
  }

  // Eliminar caracteres peligrosos para SQL injection
  return input
    .replace(/['";`\\]/g, '') // Eliminar comillas y backslashes
    .replace(/--/g, '') // Eliminar comentarios SQL
    .replace(/\/\*/g, '') // Eliminar inicio de comentarios multi-línea
    .replace(/\*\//g, '') // Eliminar fin de comentarios multi-línea
    .trim();
}

/**
 * Validar cantidad de agua (ml)
 * @param {any} amount - Cantidad a validar
 * @returns {number} - Cantidad válida
 * @throws {Error} - Si la cantidad no es válida
 */
export function validateWaterAmount(amount) {
  const num = parseInt(amount);

  if (isNaN(num)) {
    throw new Error('Water amount must be a number');
  }

  if (num < 0) {
    throw new Error('Water amount cannot be negative');
  }

  if (num > 10000) {
    throw new Error('Water amount is too large (max 10000ml)');
  }

  return num;
}

/**
 * Validar datos de contenedor
 * @param {object} containerData - Datos del contenedor
 * @returns {object} - Datos validados
 * @throws {Error} - Si los datos no son válidos
 */
export function validateContainerData(containerData) {
  const { name, volume, type, color } = containerData;

  // Validar nombre
  if (!name || typeof name !== 'string') {
    throw new Error('Container name is required and must be a string');
  }

  if (name.length < 1 || name.length > 50) {
    throw new Error('Container name must be between 1 and 50 characters');
  }

  // Validar volumen
  const validVolume = validateWaterAmount(volume);

  // Validar tipo (ícono)
  if (!type || typeof type !== 'string') {
    throw new Error('Container type (icon) is required');
  }

  // Validar color (formato hex)
  if (!color || !isValidHexColor(color)) {
    throw new Error('Container color must be a valid hex color (e.g., #4A90E2)');
  }

  return {
    name: sanitizeInput(name),
    volume: validVolume,
    type: sanitizeInput(type),
    color: color.toUpperCase(),
    isCustom: containerData.isCustom !== undefined ? Boolean(containerData.isCustom) : true,
  };
}

/**
 * Validar color hexadecimal
 * @param {string} color - Color a validar
 * @returns {boolean} - true si es válido
 */
export function isValidHexColor(color) {
  if (typeof color !== 'string') {
    return false;
  }

  // Formato: #RGB o #RRGGBB
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar fecha en formato YYYY-MM-DD
 * @param {string} date - Fecha a validar
 * @returns {boolean} - true si es válida
 */
export function isValidDate(date) {
  if (typeof date !== 'string') {
    return false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  // Verificar que sea una fecha real
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validar hora en formato HH:MM
 * @param {string} time - Hora a validar
 * @returns {boolean} - true si es válida
 */
export function isValidTime(time) {
  if (typeof time !== 'string') {
    return false;
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Validar configuraciones de la app
 * @param {object} settings - Configuraciones a validar
 * @returns {object} - Configuraciones validadas
 * @throws {Error} - Si las configuraciones no son válidas
 */
export function validateSettings(settings) {
  const validated = {};

  // Validar dailyGoal
  if (settings.dailyGoal !== undefined) {
    validated.dailyGoal = validateWaterAmount(settings.dailyGoal);
  }

  // Validar notificationsEnabled
  if (settings.notificationsEnabled !== undefined) {
    validated.notificationsEnabled = Boolean(settings.notificationsEnabled);
  }

  // Validar notificationStartTime
  if (settings.notificationStartTime !== undefined) {
    if (!isValidTime(settings.notificationStartTime)) {
      throw new Error('Invalid notification start time (use HH:MM format)');
    }
    validated.notificationStartTime = settings.notificationStartTime;
  }

  // Validar notificationEndTime
  if (settings.notificationEndTime !== undefined) {
    if (!isValidTime(settings.notificationEndTime)) {
      throw new Error('Invalid notification end time (use HH:MM format)');
    }
    validated.notificationEndTime = settings.notificationEndTime;
  }

  // Validar notificationFrequency
  if (settings.notificationFrequency !== undefined) {
    const validFrequencies = ['thirty', 'sixty', 'ninety', 'onetwenty'];
    if (!validFrequencies.includes(settings.notificationFrequency)) {
      throw new Error(`Invalid notification frequency. Must be one of: ${validFrequencies.join(', ')}`);
    }
    validated.notificationFrequency = settings.notificationFrequency;
  }

  // Validar unit
  if (settings.unit !== undefined) {
    const validUnits = ['ml', 'oz', 'l'];
    if (!validUnits.includes(settings.unit)) {
      throw new Error(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
    }
    validated.unit = settings.unit;
  }

  return validated;
}

/**
 * Validar ID (alfanumérico, guiones y guiones bajos permitidos)
 * @param {string} id - ID a validar
 * @returns {boolean} - true si es válido
 */
export function isValidId(id) {
  if (typeof id !== 'string') {
    return false;
  }

  const idRegex = /^[a-zA-Z0-9_-]+$/;
  return idRegex.test(id) && id.length > 0 && id.length <= 100;
}

/**
 * Escapar caracteres especiales para usar en SQL LIKE
 * @param {string} value - Valor a escapar
 * @returns {string} - Valor escapado
 */
export function escapeLike(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Validar rango numérico
 * @param {number} value - Valor a validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {boolean} - true si está en rango
 */
export function isInRange(value, min, max) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Truncar string a longitud máxima
 * @param {string} str - String a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - String truncado
 */
export function truncate(str, maxLength) {
  if (typeof str !== 'string') {
    return str;
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Limpiar objeto de valores null/undefined/empty
 * @param {object} obj - Objeto a limpiar
 * @returns {object} - Objeto limpio
 */
export function cleanObject(obj) {
  const cleaned = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
