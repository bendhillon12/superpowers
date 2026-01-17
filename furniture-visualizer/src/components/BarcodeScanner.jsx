import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';

/**
 * Barcode Scanner Component
 *
 * Uses device camera to scan barcodes
 * Supports both style (STYLE-###) and material (MAT-###) barcodes
 *
 * @param {Object} props
 * @param {Function} props.onScan - Callback when barcode is scanned
 * @param {string} props.buttonText - Text for the scan button
 * @param {boolean} props.disabled - Whether the scanner is disabled
 */
export default function BarcodeScanner({ onScan, buttonText = 'Scan', disabled = false }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setScanning(false);
    onScan(data);
  };

  const startScanning = () => {
    setScanned(false);
    setScanning(true);
  };

  const cancelScanning = () => {
    setScanning(false);
    setScanned(false);
  };

  if (hasPermission === null) {
    return <Text style={styles.message}>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>No access to camera</Text>
        <Text style={styles.hint}>Please enable camera permissions in settings</Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.scanButton, disabled && styles.scanButtonDisabled]}
        onPress={startScanning}
        disabled={disabled}
      >
        <Text style={styles.scanButtonText}>{buttonText}</Text>
      </TouchableOpacity>

      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={cancelScanning}
      >
        <View style={styles.modalContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.topOverlay}>
                <Text style={styles.instructionText}>
                  Position barcode within the frame
                </Text>
              </View>

              <View style={styles.scanArea}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>

              <View style={styles.bottomOverlay}>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelScanning}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  scanButtonDisabled: {
    backgroundColor: '#ccc',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scanArea: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00FF00',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00FF00',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00FF00',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00FF00',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
