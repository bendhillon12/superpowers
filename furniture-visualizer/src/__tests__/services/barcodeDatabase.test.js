import { getBarcodeData, isValidBarcode } from '../../services/barcodeDatabase';

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
