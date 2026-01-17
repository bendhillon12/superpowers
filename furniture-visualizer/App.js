import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BarcodeScanner from './src/components/BarcodeScanner';
import BarcodeAdmin from './src/components/BarcodeAdmin';
import AdminLogin from './src/components/AdminLogin';
import { useFurnitureState } from './src/hooks/useFurnitureState';
import { getBarcodeData } from './src/services/barcodeDatabase';
import { generateWithClaudeOrMock } from './src/services/claudeApi';
import { isSessionValid, logout, extendSession } from './src/services/auth';

// Set your Anthropic API key here or via environment variable
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null;

export default function App() {
  const {
    selectedStyle,
    selectedMaterial,
    generatedImage,
    setSelectedStyle,
    setSelectedMaterial,
    setGeneratedImage,
  } = useFurnitureState();

  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check session validity on mount and periodically
  useEffect(() => {
    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkSession = async () => {
    const valid = await isSessionValid();
    setIsAuthenticated(valid);
    if (valid) {
      await extendSession();
    }
  };

  const handleAdminAccess = async () => {
    const valid = await isSessionValid();
    if (valid) {
      setIsAuthenticated(true);
      setShowAdmin(true);
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setShowAdminLogin(false);
    setShowAdmin(true);
  };

  const handleAdminClose = () => {
    setShowAdmin(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setShowAdmin(false);
  };

  const handleStyleScan = async (barcode) => {
    console.log('Style scanned:', barcode);
    const data = getBarcodeData(barcode);

    if (data && data.type === 'style') {
      setSelectedStyle(data);
      Alert.alert('Style Loaded', `${data.name}\n\nNow scan a material to visualize.`);
    } else {
      Alert.alert('Invalid Barcode', 'This barcode is not registered as a furniture style.');
    }
  };

  const handleMaterialScan = async (barcode) => {
    console.log('Material scanned:', barcode);
    const data = getBarcodeData(barcode);

    if (data && data.type === 'material') {
      setSelectedMaterial(data);

      if (selectedStyle) {
        // Generate new visualization
        setLoading(true);
        try {
          const result = await generateWithClaudeOrMock(
            selectedStyle.name,
            data.name,
            ANTHROPIC_API_KEY
          );

          // Store the result
          setGeneratedImage(result);
          Alert.alert(
            'Visualization Generated',
            `${selectedStyle.name} with ${data.name}`
          );
        } catch (error) {
          Alert.alert('Error', `Failed to generate visualization: ${error.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        Alert.alert('No Style Selected', 'Please scan a furniture style first.');
      }
    } else {
      Alert.alert('Invalid Barcode', 'This barcode is not registered as a material.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Furniture Visualizer</Text>
          <Text style={styles.subtitle}>Scan barcodes to preview materials on furniture</Text>
        </View>

        {/* Current Selections */}
        {(selectedStyle || selectedMaterial) && (
          <View style={styles.infoSection}>
            {selectedStyle && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Current Style:</Text>
                <Text style={styles.infoValue}>{selectedStyle.name}</Text>
              </View>
            )}

            {selectedMaterial && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Current Material:</Text>
                <Text style={styles.infoValue}>{selectedMaterial.name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Image Display */}
        <View style={styles.imageContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Generating visualization...</Text>
              <Text style={styles.loadingHint}>This may take a few seconds</Text>
            </View>
          ) : generatedImage ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Generated Result</Text>
              {generatedImage.mockImageUrl && (
                <Image
                  source={{ uri: generatedImage.mockImageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.resultDescription}>{generatedImage.content}</Text>
              <Text style={styles.resultNote}>{generatedImage.note}</Text>
            </View>
          ) : selectedStyle ? (
            <View style={styles.imagePreview}>
              <Text style={styles.previewLabel}>Preview (Original)</Text>
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>{selectedStyle.name}</Text>
                <Text style={styles.placeholderHint}>Scan a material to generate visualization</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📷</Text>
              <Text style={styles.emptyStateText}>Scan a furniture style to begin</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <BarcodeScanner
            onScan={handleStyleScan}
            buttonText="Scan Style"
            disabled={loading}
          />

          <BarcodeScanner
            onScan={handleMaterialScan}
            buttonText="Scan Material"
            disabled={!selectedStyle || loading}
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to use:</Text>
          <Text style={styles.instructionsText}>1. Tap "Scan Style" and scan a furniture barcode</Text>
          <Text style={styles.instructionsText}>2. Tap "Scan Material" and scan a material barcode</Text>
          <Text style={styles.instructionsText}>3. View the AI-generated visualization</Text>
          <Text style={styles.instructionsText}>4. Scan more materials to try different options</Text>
        </View>

        {/* Test Barcodes */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Test Barcodes:</Text>
          <View style={styles.testBarcodes}>
            <View style={styles.testBarcode}>
              <Text style={styles.testBarcodeType}>Style</Text>
              <Text style={styles.testBarcodeCode}>STYLE-001</Text>
              <Text style={styles.testBarcodeName}>Modern Sectional Sofa</Text>
            </View>
            <View style={styles.testBarcode}>
              <Text style={styles.testBarcodeType}>Material</Text>
              <Text style={styles.testBarcodeCode}>MAT-001</Text>
              <Text style={styles.testBarcodeName}>Grey Linen Fabric</Text>
            </View>
          </View>
        </View>

        {/* Admin Button */}
        <TouchableOpacity
          style={styles.adminButton}
          onPress={handleAdminAccess}
        >
          <Text style={styles.adminButtonText}>
            {isAuthenticated ? 'Admin Panel' : 'Admin Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Admin Login Modal */}
      <Modal
        visible={showAdminLogin}
        animationType="fade"
        transparent={true}
      >
        <AdminLogin
          onAuthenticated={handleAuthenticated}
          onCancel={() => setShowAdminLogin(false)}
        />
      </Modal>

      {/* Admin Panel Modal */}
      <Modal
        visible={showAdmin}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.adminHeader}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <BarcodeAdmin
          onClose={handleAdminClose}
          onAssign={(data) => {
            Alert.alert('Barcode Added', `${data.id} assigned to "${data.name}"`);
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    gap: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  imageContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    minHeight: 300,
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  loadingHint: {
    fontSize: 14,
    color: '#666',
  },
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  resultNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  imagePreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  placeholderHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 16,
  },
  instructions: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 8,
  },
  testSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  testBarcodes: {
    flexDirection: 'row',
    gap: 12,
  },
  testBarcode: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  testBarcodeType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  testBarcodeCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  testBarcodeName: {
    fontSize: 12,
    color: '#666',
  },
  adminButton: {
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  adminButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  adminHeader: {
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
