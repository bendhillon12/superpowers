import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { addBarcode, isValidBarcode } from '../services/barcodeDatabase';

export default function BarcodeAdmin({ onAssign, onClose }) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState('style'); // 'style' or 'material'
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAssign = () => {
    setError(null);
    setSuccess(null);

    if (!barcode || !name || !imageUrl) {
      setError('All fields are required');
      return;
    }

    if (!isValidBarcode(barcode)) {
      setError('Invalid barcode format. Use STYLE-### or MAT-###');
      return;
    }

    try {
      const data = {
        id: barcode,
        type,
        name,
        imageUrl,
      };

      addBarcode(barcode, data);

      if (onAssign) {
        onAssign(data);
      }

      setSuccess(`Successfully assigned ${barcode} to "${name}"`);

      // Clear form
      setBarcode('');
      setName('');
      setImageUrl('');
    } catch (err) {
      setError(err.message);
    }
  };

  const generateBarcodeId = () => {
    const prefix = type === 'style' ? 'STYLE' : 'MAT';
    const num = Math.floor(Math.random() * 900) + 100; // 100-999
    setBarcode(`${prefix}-${num}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assign Barcode</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'style' && styles.typeButtonActive]}
          onPress={() => setType('style')}
        >
          <Text style={[styles.typeButtonText, type === 'style' && styles.typeButtonTextActive]}>
            Style (Furniture)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === 'material' && styles.typeButtonActive]}
          onPress={() => setType('material')}
        >
          <Text style={[styles.typeButtonText, type === 'material' && styles.typeButtonTextActive]}>
            Material (Fabric)
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Barcode ID</Text>
      <View style={styles.barcodeRow}>
        <TextInput
          style={[styles.input, styles.barcodeInput]}
          placeholder={type === 'style' ? 'STYLE-001' : 'MAT-001'}
          value={barcode}
          onChangeText={setBarcode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.generateButton} onPress={generateBarcodeId}>
          <Text style={styles.generateButtonText}>Generate</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder={type === 'style' ? 'Modern Sectional Sofa' : 'Grey Linen Fabric'}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Image URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/image.jpg"
        value={imageUrl}
        onChangeText={setImageUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      {imageUrl && (
        <View style={styles.previewContainer}>
          <Text style={styles.label}>Preview</Text>
          <Image
            source={{ uri: imageUrl }}
            style={styles.preview}
            onError={() => setError('Failed to load image preview')}
          />
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {success && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.assignButton} onPress={handleAssign}>
        <Text style={styles.assignButtonText}>Assign Barcode</Text>
      </TouchableOpacity>

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Barcode Format</Text>
        <Text style={styles.helpText}>
          {'\u2022'} Furniture styles: STYLE-### (e.g., STYLE-001){'\n'}
          {'\u2022'} Materials: MAT-### (e.g., MAT-001){'\n'}
          {'\u2022'} Numbers must be 3+ digits
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  barcodeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  barcodeInput: {
    flex: 1,
  },
  generateButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  typeButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#007AFF',
  },
  previewContainer: {
    marginTop: 12,
  },
  preview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  errorBox: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c00',
  },
  successBox: {
    backgroundColor: '#efe',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cfc',
  },
  successText: {
    color: '#080',
  },
  assignButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpSection: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
