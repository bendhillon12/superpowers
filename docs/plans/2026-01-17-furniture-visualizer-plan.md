# Furniture Visualizer - Implementation Plan

**Date:** 2026-01-17
**Design Doc:** 2026-01-17-furniture-visualizer-design.md
**Approach:** Test-Driven Development (RED-GREEN-REFACTOR)

## Overview

Build a furniture visualization app using Expo (web + Android) that scans barcodes to load furniture styles and materials, then uses Google Nano Banana Pro to generate realistic material-swapped furniture images.

## Prerequisites

- [x] Expo project created at `/home/user/superpowers/furniture-visualizer`
- [ ] Google Gemini API key obtained
- [ ] Sample furniture and material images prepared

## Phase 1: Project Setup & Test Infrastructure

### Task 1.1: Install Testing Dependencies
**File:** `furniture-visualizer/package.json`
**Action:** Install Jest, React Testing Library, and testing utilities

```bash
cd furniture-visualizer
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
npm install --save-dev @testing-library/react-hooks
```

**Verification:** `npm test` should run (even if no tests exist)

### Task 1.2: Configure Jest
**File:** `furniture-visualizer/jest.config.js`
**Action:** Create Jest configuration

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
  ],
};
```

**Verification:** Jest config loads without errors

### Task 1.3: Create Project Structure
**Files:** Create directory structure

```
furniture-visualizer/
  src/
    components/
      BarcodeScanner.jsx
      ScanButton.jsx
      FurnitureDisplay.jsx
    services/
      barcodeDatabase.js
      geminiApi.js
    hooks/
      useFurnitureState.js
    utils/
      validators.js
    __tests__/
      components/
      services/
      hooks/
      integration/
  public/
    images/
      styles/
      materials/
  data/
    barcodes.json
```

**Verification:** Directory structure exists

## Phase 2: Barcode Database (TDD)

### Task 2.1: RED - Write Tests for Barcode Database
**File:** `src/__tests__/services/barcodeDatabase.test.js`

```javascript
import { getBarcodeData, addBarcode, isValidBarcode } from '../../services/barcodeDatabase';

describe('Barcode Database', () => {
  test('should return furniture data for valid style barcode', () => {
    const result = getBarcodeData('STYLE-001');
    expect(result).toEqual({
      id: 'STYLE-001',
      type: 'style',
      name: 'Modern Sectional',
      imageUrl: '/images/styles/modern-sectional.jpg'
    });
  });

  test('should return material data for valid material barcode', () => {
    const result = getBarcodeData('MAT-001');
    expect(result).toEqual({
      id: 'MAT-001',
      type: 'material',
      name: 'Grey Linen',
      imageUrl: '/images/materials/grey-linen.jpg'
    });
  });

  test('should return null for invalid barcode', () => {
    const result = getBarcodeData('INVALID');
    expect(result).toBeNull();
  });

  test('should validate barcode format correctly', () => {
    expect(isValidBarcode('STYLE-001')).toBe(true);
    expect(isValidBarcode('MAT-001')).toBe(true);
    expect(isValidBarcode('INVALID')).toBe(false);
    expect(isValidBarcode('')).toBe(false);
  });
});
```

**Verification:** Tests fail (RED) - `npm test` shows failures

### Task 2.2: GREEN - Implement Barcode Database
**File:** `src/services/barcodeDatabase.js`

```javascript
import barcodeData from '../../data/barcodes.json';

export function isValidBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') return false;
  return /^(STYLE|MAT)-\d{3,}$/.test(barcode);
}

export function getBarcodeData(barcode) {
  if (!isValidBarcode(barcode)) return null;
  return barcodeData[barcode] || null;
}

export function addBarcode(barcode, data) {
  if (!isValidBarcode(barcode)) {
    throw new Error('Invalid barcode format');
  }
  barcodeData[barcode] = data;
  return true;
}
```

**Verification:** Tests pass (GREEN) - `npm test` all pass

### Task 2.3: Create Initial Barcode Data
**File:** `data/barcodes.json`

```json
{
  "STYLE-001": {
    "id": "STYLE-001",
    "type": "style",
    "name": "Modern Sectional",
    "imageUrl": "/images/styles/modern-sectional.jpg"
  },
  "MAT-001": {
    "id": "MAT-001",
    "type": "material",
    "name": "Grey Linen",
    "imageUrl": "/images/materials/grey-linen.jpg"
  }
}
```

**Verification:** JSON is valid, loads without errors

## Phase 3: State Management (TDD)

### Task 3.1: RED - Write Tests for Furniture State Hook
**File:** `src/__tests__/hooks/useFurnitureState.test.js`

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useFurnitureState } from '../../hooks/useFurnitureState';

describe('useFurnitureState', () => {
  test('should initialize with null values', () => {
    const { result } = renderHook(() => useFurnitureState());
    expect(result.current.selectedStyle).toBeNull();
    expect(result.current.selectedMaterial).toBeNull();
    expect(result.current.generatedImage).toBeNull();
  });

  test('should update selected style', () => {
    const { result } = renderHook(() => useFurnitureState());
    const styleData = { id: 'STYLE-001', name: 'Modern Sectional' };

    act(() => {
      result.current.setSelectedStyle(styleData);
    });

    expect(result.current.selectedStyle).toEqual(styleData);
  });

  test('should update selected material', () => {
    const { result } = renderHook(() => useFurnitureState());
    const materialData = { id: 'MAT-001', name: 'Grey Linen' };

    act(() => {
      result.current.setSelectedMaterial(materialData);
    });

    expect(result.current.selectedMaterial).toEqual(materialData);
  });

  test('should keep style when material changes', () => {
    const { result } = renderHook(() => useFurnitureState());
    const styleData = { id: 'STYLE-001' };
    const material1 = { id: 'MAT-001' };
    const material2 = { id: 'MAT-002' };

    act(() => {
      result.current.setSelectedStyle(styleData);
      result.current.setSelectedMaterial(material1);
    });

    expect(result.current.selectedStyle).toEqual(styleData);

    act(() => {
      result.current.setSelectedMaterial(material2);
    });

    expect(result.current.selectedStyle).toEqual(styleData);
    expect(result.current.selectedMaterial).toEqual(material2);
  });

  test('should clear generated image when new style selected', () => {
    const { result } = renderHook(() => useFurnitureState());

    act(() => {
      result.current.setGeneratedImage('image-url-1');
    });

    expect(result.current.generatedImage).toBe('image-url-1');

    act(() => {
      result.current.setSelectedStyle({ id: 'STYLE-002' });
    });

    expect(result.current.generatedImage).toBeNull();
  });
});
```

**Verification:** Tests fail (RED)

### Task 3.2: GREEN - Implement State Hook
**File:** `src/hooks/useFurnitureState.js`

```javascript
import { useState, useCallback } from 'react';

export function useFurnitureState() {
  const [selectedStyle, setSelectedStyleInternal] = useState(null);
  const [selectedMaterial, setSelectedMaterialInternal] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);

  const setSelectedStyle = useCallback((style) => {
    setSelectedStyleInternal(style);
    // Clear generated image when style changes
    setGeneratedImage(null);
  }, []);

  const setSelectedMaterial = useCallback((material) => {
    setSelectedMaterialInternal(material);
  }, []);

  return {
    selectedStyle,
    selectedMaterial,
    generatedImage,
    setSelectedStyle,
    setSelectedMaterial,
    setGeneratedImage,
  };
}
```

**Verification:** Tests pass (GREEN)

## Phase 4: Gemini API Integration (TDD)

### Task 4.1: Install Dependencies
**Command:**
```bash
npm install @google/generative-ai
npm install react-native-dotenv
```

**Verification:** Packages installed

### Task 4.2: RED - Write Tests for Gemini Service
**File:** `src/__tests__/services/geminiApi.test.js`

```javascript
import { generateMaterialSwap, validateApiKey } from '../../services/geminiApi';

describe('Gemini API Service', () => {
  test('should validate API key format', () => {
    expect(validateApiKey('AIza...')).toBe(true);
    expect(validateApiKey('')).toBe(false);
    expect(validateApiKey(null)).toBe(false);
  });

  test('should throw error if no API key provided', async () => {
    await expect(
      generateMaterialSwap(null, 'style-url', 'material-url')
    ).rejects.toThrow('API key is required');
  });

  test('should format request correctly', async () => {
    const mockApiKey = 'test-key';
    const styleUrl = 'https://example.com/style.jpg';
    const materialUrl = 'https://example.com/material.jpg';

    // Mock will be needed here
    // This test verifies the request structure
  });
});
```

**Verification:** Tests fail (RED)

### Task 4.3: GREEN - Implement Gemini Service
**File:** `src/services/geminiApi.js`

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

export function validateApiKey(apiKey) {
  return apiKey && typeof apiKey === 'string' && apiKey.length > 0;
}

export async function generateMaterialSwap(apiKey, styleImageUrl, materialImageUrl) {
  if (!validateApiKey(apiKey)) {
    throw new Error('API key is required');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image' });

  // Fetch images and convert to base64
  const [styleImage, materialImage] = await Promise.all([
    fetchImageAsBase64(styleImageUrl),
    fetchImageAsBase64(materialImageUrl),
  ]);

  const prompt = `Replace the upholstery material on this furniture with the provided material texture.
Maintain the exact shape, structure, and lighting of the original furniture.
Apply the new material texture realistically, preserving shadows and highlights.
Ensure the result looks photorealistic.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: styleImage,
        mimeType: 'image/jpeg',
      },
    },
    {
      inlineData: {
        data: materialImage,
        mimeType: 'image/jpeg',
      },
    },
  ]);

  const response = await result.response;
  return response.text(); // Or image URL depending on response format
}

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

**Verification:** Tests pass (GREEN)

## Phase 5: Barcode Scanner Component (TDD)

### Task 5.1: Install Barcode Scanner
**Command:**
```bash
expo install expo-barcode-scanner
expo install expo-camera
```

**Verification:** Packages installed

### Task 5.2: RED - Write Tests for Barcode Scanner
**File:** `src/__tests__/components/BarcodeScanner.test.jsx`

```javascript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BarcodeScanner from '../../components/BarcodeScanner';

describe('BarcodeScanner Component', () => {
  test('should render scan button', () => {
    const { getByText } = render(<BarcodeScanner onScan={() => {}} />);
    expect(getByText('Start Scanning')).toBeTruthy();
  });

  test('should call onScan when barcode detected', () => {
    const onScanMock = jest.fn();
    const { getByTestId } = render(<BarcodeScanner onScan={onScanMock} />);

    // Simulate barcode scan
    const scanner = getByTestId('barcode-scanner');
    fireEvent(scanner, 'barCodeScanned', { data: 'STYLE-001' });

    expect(onScanMock).toHaveBeenCalledWith('STYLE-001');
  });

  test('should request camera permission before scanning', () => {
    // Test permission request flow
  });
});
```

**Verification:** Tests fail (RED)

### Task 5.3: GREEN - Implement Barcode Scanner
**File:** `src/components/BarcodeScanner.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function BarcodeScanner({ onScan, buttonText = 'Start Scanning' }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanning(false);
    onScan(data);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {scanning ? (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            testID="barcode-scanner"
            onBarCodeScanned={handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <Button title="Cancel" onPress={() => setScanning(false)} />
        </View>
      ) : (
        <Button title={buttonText} onPress={() => setScanning(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
  },
});
```

**Verification:** Tests pass (GREEN)

## Phase 6: Main App Integration

### Task 6.1: Create Main App Component
**File:** `App.js`

```javascript
import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import BarcodeScanner from './src/components/BarcodeScanner';
import { useFurnitureState } from './src/hooks/useFurnitureState';
import { getBarcodeData } from './src/services/barcodeDatabase';
import { generateMaterialSwap } from './src/services/geminiApi';

export default function App() {
  const {
    selectedStyle,
    selectedMaterial,
    generatedImage,
    setSelectedStyle,
    setSelectedMaterial,
    setGeneratedImage,
  } = useFurnitureState();

  const [mode, setMode] = React.useState(null); // 'style' or 'material'
  const [loading, setLoading] = React.useState(false);

  const handleStyleScan = async (barcode) => {
    const data = getBarcodeData(barcode);
    if (data && data.type === 'style') {
      setSelectedStyle(data);
      setMode(null);
    } else {
      alert('Invalid style barcode');
    }
  };

  const handleMaterialScan = async (barcode) => {
    const data = getBarcodeData(barcode);
    if (data && data.type === 'material') {
      setSelectedMaterial(data);
      setMode(null);

      // Generate new image if style is selected
      if (selectedStyle) {
        setLoading(true);
        try {
          const result = await generateMaterialSwap(
            process.env.GEMINI_API_KEY,
            selectedStyle.imageUrl,
            data.imageUrl
          );
          setGeneratedImage(result);
        } catch (error) {
          alert('Error generating image: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    } else {
      alert('Invalid material barcode');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Furniture Visualizer</Text>

      {selectedStyle && (
        <View style={styles.infoBox}>
          <Text>Current Style: {selectedStyle.name}</Text>
        </View>
      )}

      {selectedMaterial && (
        <View style={styles.infoBox}>
          <Text>Current Material: {selectedMaterial.name}</Text>
        </View>
      )}

      <View style={styles.imageContainer}>
        {generatedImage ? (
          <Image source={{ uri: generatedImage }} style={styles.image} />
        ) : selectedStyle ? (
          <Image source={{ uri: selectedStyle.imageUrl }} style={styles.image} />
        ) : (
          <Text>Scan a furniture style to begin</Text>
        )}
        {loading && <Text>Generating...</Text>}
      </View>

      <View style={styles.buttonContainer}>
        {mode === 'style' ? (
          <BarcodeScanner onScan={handleStyleScan} buttonText="Scanning Style..." />
        ) : (
          <TouchableOpacity style={styles.button} onPress={() => setMode('style')}>
            <Text style={styles.buttonText}>Scan Style</Text>
          </TouchableOpacity>
        )}

        {mode === 'material' ? (
          <BarcodeScanner onScan={handleMaterialScan} buttonText="Scanning Material..." />
        ) : (
          <TouchableOpacity
            style={[styles.button, !selectedStyle && styles.buttonDisabled]}
            onPress={() => setMode('material')}
            disabled={!selectedStyle}
          >
            <Text style={styles.buttonText}>Scan Material</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 140,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
```

**Verification:** App runs, UI displays correctly

## Phase 7: Barcode Assignment Tool

### Task 7.1: Create Admin Component
**File:** `src/components/BarcodeAdmin.jsx`

```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image } from 'react-native';

export default function BarcodeAdmin({ onAssign }) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState('style'); // 'style' or 'material'

  const handleAssign = () => {
    if (!barcode || !name || !imageUrl) {
      alert('All fields are required');
      return;
    }

    onAssign({
      id: barcode,
      type,
      name,
      imageUrl,
    });

    // Clear form
    setBarcode('');
    setName('');
    setImageUrl('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign Barcode</Text>

      <TextInput
        style={styles.input}
        placeholder="Barcode (e.g., STYLE-001)"
        value={barcode}
        onChangeText={setBarcode}
      />

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Image URL"
        value={imageUrl}
        onChangeText={setImageUrl}
      />

      <View style={styles.typeSelector}>
        <Button
          title="Style"
          onPress={() => setType('style')}
          color={type === 'style' ? '#007AFF' : '#ccc'}
        />
        <Button
          title="Material"
          onPress={() => setType('material')}
          color={type === 'material' ? '#007AFF' : '#ccc'}
        />
      </View>

      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.preview} />
      )}

      <Button title="Assign Barcode" onPress={handleAssign} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  preview: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginVertical: 10,
    alignSelf: 'center',
  },
});
```

**Verification:** Admin tool displays and accepts input

## Phase 8: Environment Configuration

### Task 8.1: Create .env File
**File:** `.env`

```
GEMINI_API_KEY=your_api_key_here
```

**Verification:** Environment variable loads

### Task 8.2: Update .gitignore
**File:** `.gitignore`

Add:
```
.env
```

**Verification:** .env not tracked by git

## Phase 9: Testing & Deployment

### Task 9.1: Run All Tests
**Command:** `npm test`
**Verification:** All tests pass

### Task 9.2: Test Web Build
**Command:** `expo start --web`
**Verification:** App runs in browser

### Task 9.3: Test Android Build
**Command:** `eas build --platform android`
**Verification:** APK builds successfully

## Success Criteria

- [ ] All unit tests pass
- [ ] Barcode scanning works for both styles and materials
- [ ] Image generation produces realistic material swaps
- [ ] Style persists across multiple material scans
- [ ] Admin tool can assign barcodes to images
- [ ] App runs on web browser
- [ ] APK can be generated via Expo
- [ ] No sensitive data (API keys) in code

## Estimated Complexity

- **Setup:** Low (2-3 tasks)
- **Database & State:** Low-Medium (4-5 tasks)
- **API Integration:** Medium-High (requires external service)
- **UI Components:** Medium (6-8 tasks)
- **Testing:** Medium (ongoing throughout)
- **Deployment:** Low-Medium (2-3 tasks)

**Total Tasks:** ~25-30 bite-sized tasks
