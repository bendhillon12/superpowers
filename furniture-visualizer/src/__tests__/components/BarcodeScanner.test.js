import React from 'react';
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react';
import BarcodeScanner from '../../components/BarcodeScanner';

// Mock expo-camera
const mockRequestCameraPermissionsAsync = jest.fn();

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: () => mockRequestCameraPermissionsAsync(),
  },
  CameraView: ({ children, onBarcodeScanned }) => {
    // Store the callback so tests can trigger it
    global.mockOnBarcodeScanned = onBarcodeScanned;
    return <div data-testid="camera-view">{children}</div>;
  },
}));

// Helper to find text that may be nested in react-native-web divs
const findTextContent = (container, text) => {
  const elements = container.querySelectorAll('div');
  for (const el of elements) {
    if (el.textContent === text && el.children.length === 0) {
      return el;
    }
  }
  return null;
};

describe('BarcodeScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockOnBarcodeScanned = null;
  });

  describe('permission states', () => {
    test('shows loading message while requesting permissions', async () => {
      // Never resolve the permission request
      mockRequestCameraPermissionsAsync.mockImplementation(() => new Promise(() => {}));

      const { container } = render(
        <BarcodeScanner onScan={jest.fn()} />
      );

      expect(container.textContent).toContain('Requesting camera permission...');
    });

    test('shows permission denied message when camera access is denied', async () => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { container } = render(
        <BarcodeScanner onScan={jest.fn()} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('No access to camera');
        expect(container.textContent).toContain('Please enable camera permissions in settings');
      });
    });

    test('shows scan button when permission is granted', async () => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const { container } = render(
        <BarcodeScanner onScan={jest.fn()} buttonText="Scan Style" />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan Style');
      });
    });
  });

  describe('button behavior', () => {
    beforeEach(() => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
    });

    test('renders with default button text', async () => {
      const { container } = render(
        <BarcodeScanner onScan={jest.fn()} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan');
      });
    });

    test('renders with custom button text', async () => {
      const { container } = render(
        <BarcodeScanner onScan={jest.fn()} buttonText="Scan Material" />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan Material');
      });
    });

    test('button click opens scanner when not disabled', async () => {
      const { container } = render(
        <BarcodeScanner onScan={jest.fn()} buttonText="Scan" disabled={false} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan');
      });

      // Find and click the button
      const button = findTextContent(container, 'Scan');
      expect(button).toBeTruthy();

      await act(async () => {
        fireEvent.click(button.parentElement);
      });

      // After click, modal should open showing cancel button (modal renders in portal)
      await waitFor(() => {
        expect(document.body.textContent).toContain('Cancel');
      });
    });
  });

  describe('scanning behavior', () => {
    beforeEach(() => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
    });

    test('opens camera modal when scan button is pressed', async () => {
      const { container } = render(
        <BarcodeScanner onScan={jest.fn()} buttonText="Scan" />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan');
      });

      const button = findTextContent(container, 'Scan');

      await act(async () => {
        fireEvent.click(button.parentElement);
      });

      // Modal renders in portal, check document.body
      await waitFor(() => {
        expect(document.body.textContent).toContain('Position barcode within the frame');
        expect(document.body.textContent).toContain('Cancel');
      });
    });

    test('cancel button is clickable', async () => {
      const { container } = render(
        <BarcodeScanner onScan={jest.fn()} buttonText="Scan" />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan');
      });

      // Open scanner
      const scanButton = findTextContent(container, 'Scan');
      await act(async () => {
        fireEvent.click(scanButton.parentElement);
      });

      // Modal renders in portal with cancel button
      await waitFor(() => {
        expect(document.body.textContent).toContain('Cancel');
      });

      // Press cancel - should not throw
      const cancelButton = findTextContent(document.body, 'Cancel');
      expect(cancelButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(cancelButton.parentElement);
      });

      // Cancel was clickable - test passes
    });

    test('calls onScan with barcode data when scanned', async () => {
      const onScan = jest.fn();
      const { container } = render(
        <BarcodeScanner onScan={onScan} buttonText="Scan" />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan');
      });

      // Open scanner
      const button = findTextContent(container, 'Scan');
      await act(async () => {
        fireEvent.click(button.parentElement);
      });

      // Simulate barcode scan
      await act(async () => {
        if (global.mockOnBarcodeScanned) {
          global.mockOnBarcodeScanned({ type: 'ean13', data: 'STYLE-001' });
        }
      });

      expect(onScan).toHaveBeenCalledWith('STYLE-001');
    });

    test('scans material barcode correctly', async () => {
      const onScan = jest.fn();
      const { container } = render(
        <BarcodeScanner onScan={onScan} buttonText="Scan" />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan');
      });

      // Open scanner
      const button = findTextContent(container, 'Scan');
      await act(async () => {
        fireEvent.click(button.parentElement);
      });

      // Modal renders in portal
      await waitFor(() => {
        expect(document.body.textContent).toContain('Cancel');
      });

      // Simulate barcode scan with material code
      await act(async () => {
        if (global.mockOnBarcodeScanned) {
          global.mockOnBarcodeScanned({ type: 'code128', data: 'MAT-001' });
        }
      });

      // onScan should be called with the material barcode
      expect(onScan).toHaveBeenCalledWith('MAT-001');
    });
  });

  describe('multiple scans', () => {
    beforeEach(() => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
    });

    test('can scan multiple barcodes in sequence', async () => {
      const onScan = jest.fn();
      const { container } = render(
        <BarcodeScanner onScan={onScan} buttonText="Scan" />
      );

      await waitFor(() => {
        expect(container.textContent).toContain('Scan');
      });

      // First scan
      let button = findTextContent(container, 'Scan');
      await act(async () => {
        fireEvent.click(button.parentElement);
      });

      await act(async () => {
        if (global.mockOnBarcodeScanned) {
          global.mockOnBarcodeScanned({ type: 'ean13', data: 'STYLE-001' });
        }
      });

      expect(onScan).toHaveBeenCalledWith('STYLE-001');

      // Wait for modal to close
      await waitFor(() => {
        expect(container.textContent).not.toContain('Cancel');
      });

      // Second scan
      button = findTextContent(container, 'Scan');
      await act(async () => {
        fireEvent.click(button.parentElement);
      });

      await act(async () => {
        if (global.mockOnBarcodeScanned) {
          global.mockOnBarcodeScanned({ type: 'ean13', data: 'MAT-001' });
        }
      });

      expect(onScan).toHaveBeenCalledWith('MAT-001');
      expect(onScan).toHaveBeenCalledTimes(2);
    });
  });
});
