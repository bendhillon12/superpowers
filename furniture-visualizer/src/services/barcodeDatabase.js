// In-memory barcode database
// In production, this would be loaded from AsyncStorage or API
const barcodeData = {
  // Furniture Styles
  'STYLE-001': {
    id: 'STYLE-001',
    type: 'style',
    name: 'Modern Sectional Sofa',
    description: 'L-shaped contemporary sectional with clean lines',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  },
  'STYLE-002': {
    id: 'STYLE-002',
    type: 'style',
    name: 'Classic Chesterfield Sofa',
    description: 'Traditional tufted sofa with rolled arms',
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800',
  },
  'STYLE-003': {
    id: 'STYLE-003',
    type: 'style',
    name: 'Mid-Century Armchair',
    description: 'Retro-inspired chair with wooden legs',
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
  },
  'STYLE-004': {
    id: 'STYLE-004',
    type: 'style',
    name: 'Scandinavian Loveseat',
    description: 'Minimalist two-seater with tapered legs',
    imageUrl: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800',
  },
  'STYLE-005': {
    id: 'STYLE-005',
    type: 'style',
    name: 'Leather Recliner',
    description: 'Comfortable power recliner with headrest',
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
  },

  // Materials/Fabrics
  'MAT-001': {
    id: 'MAT-001',
    type: 'material',
    name: 'Grey Linen Fabric',
    description: 'Natural linen in neutral grey tone',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  },
  'MAT-002': {
    id: 'MAT-002',
    type: 'material',
    name: 'Navy Blue Velvet',
    description: 'Rich velvet in deep navy color',
    imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
  },
  'MAT-003': {
    id: 'MAT-003',
    type: 'material',
    name: 'Cognac Leather',
    description: 'Premium full-grain leather in warm cognac',
    imageUrl: 'https://images.unsplash.com/photo-1531685250784-7569952593d2?w=800',
  },
  'MAT-004': {
    id: 'MAT-004',
    type: 'material',
    name: 'Emerald Green Velvet',
    description: 'Luxurious velvet in jewel-tone green',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  },
  'MAT-005': {
    id: 'MAT-005',
    type: 'material',
    name: 'Cream Boucle',
    description: 'Textured boucle fabric in soft cream',
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800',
  },
  'MAT-006': {
    id: 'MAT-006',
    type: 'material',
    name: 'Charcoal Tweed',
    description: 'Classic wool tweed in charcoal grey',
    imageUrl: 'https://images.unsplash.com/photo-1558171014-33c9310d7bc9?w=800',
  },
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
