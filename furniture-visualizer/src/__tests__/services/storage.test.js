import {
  saveCustomBarcodes,
  loadCustomBarcodes,
  saveUserPreferences,
  loadUserPreferences,
  addToScanHistory,
  getScanHistory,
  clearScanHistory,
  clearAllData,
  STORAGE_KEYS,
} from '../../services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

describe('Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('STORAGE_KEYS', () => {
    test('should have all required storage keys', () => {
      expect(STORAGE_KEYS.CUSTOM_BARCODES).toBeDefined();
      expect(STORAGE_KEYS.USER_PREFERENCES).toBeDefined();
      expect(STORAGE_KEYS.SCAN_HISTORY).toBeDefined();
    });
  });

  describe('saveCustomBarcodes', () => {
    test('should save barcodes successfully', async () => {
      const barcodes = { 'STYLE-100': { name: 'Test' } };
      const result = await saveCustomBarcodes(barcodes);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CUSTOM_BARCODES,
        JSON.stringify(barcodes)
      );
    });

    test('should return false on error', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));
      const result = await saveCustomBarcodes({});

      expect(result).toBe(false);
    });
  });

  describe('loadCustomBarcodes', () => {
    test('should load barcodes successfully', async () => {
      const barcodes = { 'STYLE-100': { name: 'Test' } };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(barcodes));

      const result = await loadCustomBarcodes();

      expect(result).toEqual(barcodes);
    });

    test('should return null when no data exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await loadCustomBarcodes();

      expect(result).toBeNull();
    });

    test('should return null on error', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await loadCustomBarcodes();

      expect(result).toBeNull();
    });
  });

  describe('saveUserPreferences', () => {
    test('should save preferences successfully', async () => {
      const preferences = { darkMode: true, autoScan: false };
      const result = await saveUserPreferences(preferences);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );
    });

    test('should return false on error', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));
      const result = await saveUserPreferences({});

      expect(result).toBe(false);
    });
  });

  describe('loadUserPreferences', () => {
    test('should load preferences successfully', async () => {
      const preferences = { darkMode: true, autoScan: false };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(preferences));

      const result = await loadUserPreferences();

      expect(result).toEqual(preferences);
    });

    test('should return defaults when no data exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await loadUserPreferences();

      expect(result).toEqual({
        darkMode: false,
        autoScan: true,
        saveHistory: true,
      });
    });

    test('should return defaults on error', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await loadUserPreferences();

      expect(result).toEqual({
        darkMode: false,
        autoScan: true,
        saveHistory: true,
      });
    });
  });

  describe('addToScanHistory', () => {
    test('should add scan to empty history', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const scanData = { styleName: 'Modern Sofa', materialName: 'Grey Linen' };

      const result = await addToScanHistory(scanData);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0]).toHaveProperty('timestamp');
      expect(savedData[0]).toHaveProperty('id');
      expect(savedData[0].styleName).toBe('Modern Sofa');
    });

    test('should add scan to existing history', async () => {
      const existingHistory = [
        { id: 'old', styleName: 'Old Scan', timestamp: 123 },
      ];
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingHistory));
      const scanData = { styleName: 'New Scan' };

      await addToScanHistory(scanData);

      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[0].styleName).toBe('New Scan');
      expect(savedData[1].styleName).toBe('Old Scan');
    });

    test('should limit history to 50 items', async () => {
      const existingHistory = Array.from({ length: 55 }, (_, i) => ({
        id: `scan_${i}`,
        styleName: `Scan ${i}`,
        timestamp: i,
      }));
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingHistory));

      await addToScanHistory({ styleName: 'New Scan' });

      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(50);
    });

    test('should return false on error', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await addToScanHistory({});

      expect(result).toBe(false);
    });
  });

  describe('getScanHistory', () => {
    test('should return scan history', async () => {
      const history = [{ id: 'scan_1', styleName: 'Test' }];
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(history));

      const result = await getScanHistory();

      expect(result).toEqual(history);
    });

    test('should return empty array when no history', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await getScanHistory();

      expect(result).toEqual([]);
    });

    test('should return empty array on error', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await getScanHistory();

      expect(result).toEqual([]);
    });
  });

  describe('clearScanHistory', () => {
    test('should clear scan history successfully', async () => {
      const result = await clearScanHistory();

      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.SCAN_HISTORY);
    });

    test('should return false on error', async () => {
      AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await clearScanHistory();

      expect(result).toBe(false);
    });
  });

  describe('clearAllData', () => {
    test('should clear all data successfully', async () => {
      const result = await clearAllData();

      expect(result).toBe(true);
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(
        Object.values(STORAGE_KEYS)
      );
    });

    test('should return false on error', async () => {
      AsyncStorage.multiRemove.mockRejectedValueOnce(new Error('Storage error'));

      const result = await clearAllData();

      expect(result).toBe(false);
    });
  });
});
