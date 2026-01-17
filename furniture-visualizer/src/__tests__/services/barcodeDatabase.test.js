import { getBarcodeData, isValidBarcode, addBarcode, getBarcodesByType } from '../../services/barcodeDatabase';

describe('Barcode Database', () => {
  describe('isValidBarcode', () => {
    test('should validate style barcode format', () => {
      expect(isValidBarcode('STYLE-001')).toBe(true);
      expect(isValidBarcode('STYLE-12345')).toBe(true);
    });

    test('should validate material barcode format', () => {
      expect(isValidBarcode('MAT-001')).toBe(true);
      expect(isValidBarcode('MAT-99999')).toBe(true);
    });

    test('should reject invalid barcode formats', () => {
      expect(isValidBarcode('INVALID')).toBe(false);
      expect(isValidBarcode('STYLE001')).toBe(false); // missing dash
      expect(isValidBarcode('MAT-AB')).toBe(false); // non-numeric
      expect(isValidBarcode('')).toBe(false);
      expect(isValidBarcode(null)).toBe(false);
      expect(isValidBarcode(undefined)).toBe(false);
    });

    test('should reject barcodes with insufficient digits', () => {
      expect(isValidBarcode('STYLE-1')).toBe(false); // needs at least 3 digits
      expect(isValidBarcode('MAT-12')).toBe(false);
    });
  });

  describe('getBarcodeData', () => {
    test('should return furniture data for valid style barcode', () => {
      const result = getBarcodeData('STYLE-001');
      expect(result).toBeTruthy();
      expect(result.id).toBe('STYLE-001');
      expect(result.type).toBe('style');
      expect(result.name).toBeDefined();
      expect(result.imageUrl).toBeDefined();
    });

    test('should return material data for valid material barcode', () => {
      const result = getBarcodeData('MAT-001');
      expect(result).toBeTruthy();
      expect(result.id).toBe('MAT-001');
      expect(result.type).toBe('material');
      expect(result.name).toBeDefined();
      expect(result.imageUrl).toBeDefined();
    });

    test('should return null for invalid barcode format', () => {
      const result = getBarcodeData('INVALID');
      expect(result).toBeNull();
    });

    test('should return null for valid format but non-existent barcode', () => {
      const result = getBarcodeData('STYLE-999999');
      expect(result).toBeNull();
    });

    test('should return null for empty or null input', () => {
      expect(getBarcodeData('')).toBeNull();
      expect(getBarcodeData(null)).toBeNull();
      expect(getBarcodeData(undefined)).toBeNull();
    });
  });

  describe('addBarcode', () => {
    test('should add a valid style barcode', () => {
      const result = addBarcode('STYLE-500', {
        type: 'style',
        name: 'Test Sofa',
        imageUrl: 'https://example.com/sofa.jpg',
      });
      expect(result).toBe(true);

      const data = getBarcodeData('STYLE-500');
      expect(data).toBeTruthy();
      expect(data.name).toBe('Test Sofa');
    });

    test('should add a valid material barcode', () => {
      const result = addBarcode('MAT-500', {
        type: 'material',
        name: 'Test Fabric',
        imageUrl: 'https://example.com/fabric.jpg',
      });
      expect(result).toBe(true);

      const data = getBarcodeData('MAT-500');
      expect(data).toBeTruthy();
      expect(data.name).toBe('Test Fabric');
    });

    test('should throw error for invalid barcode format', () => {
      expect(() => {
        addBarcode('INVALID', { name: 'Test' });
      }).toThrow('Invalid barcode format');
    });

    test('should throw error for barcode with insufficient digits', () => {
      expect(() => {
        addBarcode('STYLE-1', { name: 'Test' });
      }).toThrow('Invalid barcode format');
    });

    test('should overwrite existing barcode data', () => {
      addBarcode('STYLE-600', { type: 'style', name: 'Original', imageUrl: 'original.jpg' });
      addBarcode('STYLE-600', { type: 'style', name: 'Updated', imageUrl: 'updated.jpg' });

      const data = getBarcodeData('STYLE-600');
      expect(data.name).toBe('Updated');
    });
  });

  describe('getBarcodesByType', () => {
    beforeAll(() => {
      // Add test data
      addBarcode('STYLE-700', { type: 'style', name: 'Style 700', imageUrl: 'style700.jpg' });
      addBarcode('STYLE-701', { type: 'style', name: 'Style 701', imageUrl: 'style701.jpg' });
      addBarcode('MAT-700', { type: 'material', name: 'Material 700', imageUrl: 'mat700.jpg' });
    });

    test('should return all style barcodes', () => {
      const styles = getBarcodesByType('style');
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles.every(item => item.type === 'style')).toBe(true);
    });

    test('should return all material barcodes', () => {
      const materials = getBarcodesByType('material');
      expect(Array.isArray(materials)).toBe(true);
      expect(materials.length).toBeGreaterThan(0);
      expect(materials.every(item => item.type === 'material')).toBe(true);
    });

    test('should return empty array for unknown type', () => {
      const unknown = getBarcodesByType('unknown');
      expect(Array.isArray(unknown)).toBe(true);
      expect(unknown.length).toBe(0);
    });

    test('should include newly added barcodes', () => {
      addBarcode('STYLE-800', { type: 'style', name: 'New Style', imageUrl: 'new.jpg' });
      const styles = getBarcodesByType('style');
      const found = styles.find(s => s.id === 'STYLE-800');
      expect(found).toBeTruthy();
      expect(found.name).toBe('New Style');
    });
  });

  describe('data structure', () => {
    test('should have consistent data structure for styles', () => {
      const result = getBarcodeData('STYLE-001');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('imageUrl');
    });

    test('should have consistent data structure for materials', () => {
      const result = getBarcodeData('MAT-001');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('imageUrl');
    });
  });
});
