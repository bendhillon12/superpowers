// In-memory barcode database
// In production, this would be loaded from a file or API
const barcodeData = {
  'STYLE-001': {
    id: 'STYLE-001',
    type: 'style',
    name: 'Modern Sectional Sofa',
    imageUrl: '/images/styles/modern-sectional.jpg'
  },
  'MAT-001': {
    id: 'MAT-001',
    type: 'material',
    name: 'Grey Linen Fabric',
    imageUrl: '/images/materials/grey-linen.jpg'
  }
};

/**
 * Validates barcode format
 * Valid formats: STYLE-### or MAT-### (where ### is at least 3 digits)
 *
 * @param {string} barcode - The barcode to validate
 * @returns {boolean} - True if valid format, false otherwise
 */
export function isValidBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return false;
  }

  // Match STYLE-### or MAT-### where ### is at least 3 digits
  return /^(STYLE|MAT)-\d{3,}$/.test(barcode);
}

/**
 * Retrieves data associated with a barcode
 *
 * @param {string} barcode - The barcode to look up
 * @returns {Object|null} - Barcode data object or null if not found/invalid
 */
export function getBarcodeData(barcode) {
  if (!isValidBarcode(barcode)) {
    return null;
  }

  return barcodeData[barcode] || null;
}

/**
 * Adds or updates a barcode entry in the database
 * Note: In production, this would write to persistent storage
 *
 * @param {string} barcode - The barcode ID
 * @param {Object} data - The data to associate with the barcode
 * @returns {boolean} - True if successful
 * @throws {Error} - If barcode format is invalid
 */
export function addBarcode(barcode, data) {
  if (!isValidBarcode(barcode)) {
    throw new Error('Invalid barcode format. Use STYLE-### or MAT-### where ### is at least 3 digits');
  }

  barcodeData[barcode] = {
    id: barcode,
    ...data,
  };

  return true;
}

/**
 * Gets all barcodes of a specific type
 *
 * @param {string} type - The type to filter by ('style' or 'material')
 * @returns {Array} - Array of barcode data objects
 */
export function getBarcodesByType(type) {
  return Object.values(barcodeData).filter(item => item.type === type);
}
