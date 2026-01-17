import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CUSTOM_BARCODES: '@furniture_visualizer/custom_barcodes',
  USER_PREFERENCES: '@furniture_visualizer/preferences',
  SCAN_HISTORY: '@furniture_visualizer/scan_history',
};

/**
 * Saves custom barcodes to persistent storage
 *
 * @param {Object} barcodes - Object containing barcode data
 * @returns {Promise<boolean>} - True if successful
 */
export async function saveCustomBarcodes(barcodes) {
  try {
    const jsonValue = JSON.stringify(barcodes);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_BARCODES, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving custom barcodes:', error);
    return false;
  }
}

/**
 * Loads custom barcodes from persistent storage
 *
 * @returns {Promise<Object|null>} - Stored barcodes or null
 */
export async function loadCustomBarcodes() {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_BARCODES);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error loading custom barcodes:', error);
    return null;
  }
}

/**
 * Saves user preferences to persistent storage
 *
 * @param {Object} preferences - User preferences object
 * @returns {Promise<boolean>} - True if successful
 */
export async function saveUserPreferences(preferences) {
  try {
    const jsonValue = JSON.stringify(preferences);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return false;
  }
}

/**
 * Loads user preferences from persistent storage
 *
 * @returns {Promise<Object>} - Stored preferences or defaults
 */
export async function loadUserPreferences() {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return {
      darkMode: false,
      autoScan: true,
      saveHistory: true,
    };
  } catch (error) {
    console.error('Error loading preferences:', error);
    return {
      darkMode: false,
      autoScan: true,
      saveHistory: true,
    };
  }
}

/**
 * Adds a scan to history
 *
 * @param {Object} scanData - The scan data to save
 * @returns {Promise<boolean>} - True if successful
 */
export async function addToScanHistory(scanData) {
  try {
    const history = await getScanHistory();
    const newEntry = {
      ...scanData,
      timestamp: Date.now(),
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    history.unshift(newEntry);
    // Keep only the last 50 scans
    const trimmedHistory = history.slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(trimmedHistory));
    return true;
  } catch (error) {
    console.error('Error adding to scan history:', error);
    return false;
  }
}

/**
 * Gets scan history
 *
 * @returns {Promise<Array>} - Array of past scans
 */
export async function getScanHistory() {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting scan history:', error);
    return [];
  }
}

/**
 * Clears scan history
 *
 * @returns {Promise<boolean>} - True if successful
 */
export async function clearScanHistory() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SCAN_HISTORY);
    return true;
  } catch (error) {
    console.error('Error clearing scan history:', error);
    return false;
  }
}

/**
 * Clears all app data
 *
 * @returns {Promise<boolean>} - True if successful
 */
export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
}

export { STORAGE_KEYS };
