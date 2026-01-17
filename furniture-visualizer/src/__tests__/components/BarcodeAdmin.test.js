import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import BarcodeAdmin from '../../components/BarcodeAdmin';
import * as barcodeDatabase from '../../services/barcodeDatabase';

// Mock the barcodeDatabase service
jest.mock('../../services/barcodeDatabase', () => ({
  addBarcode: jest.fn(),
  isValidBarcode: jest.fn(),
}));

// Helper to find clickable element (TouchableOpacity) containing text
const findClickableWithText = (container, text) => {
  const elements = container.querySelectorAll('[tabindex="0"]');
  for (const el of elements) {
    if (el.textContent === text) {
      return el;
    }
  }
  // Fallback: find text and get clickable parent
  const allDivs = container.querySelectorAll('div');
  for (const el of allDivs) {
    if (el.textContent === text && el.children.length === 0) {
      // Walk up to find clickable parent
      let parent = el.parentElement;
      while (parent) {
        if (parent.getAttribute('tabindex') === '0') {
          return parent;
        }
        parent = parent.parentElement;
      }
      return el;
    }
  }
  return null;
};

// Helper for backward compatibility
const findTextContent = (container, text) => {
  return findClickableWithText(container, text);
};

// Helper to find input by placeholder
const findInputByPlaceholder = (container, placeholder) => {
  return container.querySelector(`input[placeholder="${placeholder}"]`);
};

describe('BarcodeAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    barcodeDatabase.isValidBarcode.mockImplementation((code) => {
      return /^(STYLE|MAT)-\d{3,}$/.test(code);
    });
  });

  describe('rendering', () => {
    test('renders title', () => {
      const { container } = render(<BarcodeAdmin />);
      expect(container.textContent).toContain('Assign Barcode');
    });

    test('renders close button when onClose is provided', () => {
      const { container } = render(<BarcodeAdmin onClose={jest.fn()} />);
      expect(container.textContent).toContain('Close');
    });

    test('does not render close button when onClose is not provided', () => {
      const { container } = render(<BarcodeAdmin />);
      const closeButton = findTextContent(container, 'Close');
      expect(closeButton).toBeNull();
    });

    test('renders type selector with style and material options', () => {
      const { container } = render(<BarcodeAdmin />);
      expect(container.textContent).toContain('Style (Furniture)');
      expect(container.textContent).toContain('Material (Fabric)');
    });

    test('renders form fields', () => {
      const { container } = render(<BarcodeAdmin />);
      expect(container.textContent).toContain('Barcode ID');
      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Image URL');
    });

    test('renders generate and assign buttons', () => {
      const { container } = render(<BarcodeAdmin />);
      expect(container.textContent).toContain('Generate');
      expect(container.textContent).toContain('Assign Barcode');
    });

    test('renders help section with barcode format info', () => {
      const { container } = render(<BarcodeAdmin />);
      expect(container.textContent).toContain('Barcode Format');
      expect(container.textContent).toContain('STYLE-###');
      expect(container.textContent).toContain('MAT-###');
    });
  });

  describe('type selector', () => {
    test('defaults to style type', () => {
      const { container } = render(<BarcodeAdmin />);
      // Check placeholder shows STYLE-001
      const input = findInputByPlaceholder(container, 'STYLE-001');
      expect(input).toBeTruthy();
    });

    test('switches to material type when clicked', async () => {
      const { container } = render(<BarcodeAdmin />);

      const materialButton = findTextContent(container, 'Material (Fabric)');
      await act(async () => {
        fireEvent.click(materialButton);
      });

      // Check placeholder changes to MAT-001
      const input = findInputByPlaceholder(container, 'MAT-001');
      expect(input).toBeTruthy();
    });
  });

  describe('generate button', () => {
    test('generates a valid style barcode when type is style', async () => {
      const { container } = render(<BarcodeAdmin />);

      const generateButton = findTextContent(container, 'Generate');
      await act(async () => {
        fireEvent.click(generateButton);
      });

      const input = findInputByPlaceholder(container, 'STYLE-001');
      expect(input.value).toMatch(/^STYLE-\d{3}$/);
    });

    test('generates a valid material barcode when type is material', async () => {
      const { container } = render(<BarcodeAdmin />);

      // Switch to material type
      const materialButton = findTextContent(container, 'Material (Fabric)');
      await act(async () => {
        fireEvent.click(materialButton);
      });

      const generateButton = findTextContent(container, 'Generate');
      await act(async () => {
        fireEvent.click(generateButton);
      });

      const input = findInputByPlaceholder(container, 'MAT-001');
      expect(input.value).toMatch(/^MAT-\d{3}$/);
    });
  });

  describe('validation', () => {
    test('shows error when fields are empty', async () => {
      const { container } = render(<BarcodeAdmin />);

      const assignButton = findClickableWithText(container, 'Assign Barcode');
      await act(async () => {
        fireEvent.click(assignButton);
      });

      expect(container.textContent).toContain('All fields are required');
    });

    test('shows error for invalid barcode format', async () => {
      const { container } = render(<BarcodeAdmin />);

      // Fill in form with invalid barcode
      const barcodeInput = findInputByPlaceholder(container, 'STYLE-001');
      const nameInput = findInputByPlaceholder(container, 'Modern Sectional Sofa');
      const urlInput = findInputByPlaceholder(container, 'https://example.com/image.jpg');

      await act(async () => {
        fireEvent.change(barcodeInput, { target: { value: 'INVALID' } });
        fireEvent.change(nameInput, { target: { value: 'Test Name' } });
        fireEvent.change(urlInput, { target: { value: 'https://example.com/test.jpg' } });
      });

      const assignButton = findTextContent(container, 'Assign Barcode');
      await act(async () => {
        fireEvent.click(assignButton);
      });

      expect(container.textContent).toContain('Invalid barcode format');
    });
  });

  describe('successful assignment', () => {
    test('calls onAssign with correct data', async () => {
      const onAssign = jest.fn();
      const { container } = render(<BarcodeAdmin onAssign={onAssign} />);

      // Fill in form
      const barcodeInput = findInputByPlaceholder(container, 'STYLE-001');
      const nameInput = findInputByPlaceholder(container, 'Modern Sectional Sofa');
      const urlInput = findInputByPlaceholder(container, 'https://example.com/image.jpg');

      await act(async () => {
        fireEvent.change(barcodeInput, { target: { value: 'STYLE-123' } });
        fireEvent.change(nameInput, { target: { value: 'Test Sofa' } });
        fireEvent.change(urlInput, { target: { value: 'https://example.com/sofa.jpg' } });
      });

      const assignButton = findTextContent(container, 'Assign Barcode');
      await act(async () => {
        fireEvent.click(assignButton);
      });

      expect(onAssign).toHaveBeenCalledWith({
        id: 'STYLE-123',
        type: 'style',
        name: 'Test Sofa',
        imageUrl: 'https://example.com/sofa.jpg',
      });
    });

    test('calls addBarcode from service', async () => {
      const { container } = render(<BarcodeAdmin />);

      // Fill in form
      const barcodeInput = findInputByPlaceholder(container, 'STYLE-001');
      const nameInput = findInputByPlaceholder(container, 'Modern Sectional Sofa');
      const urlInput = findInputByPlaceholder(container, 'https://example.com/image.jpg');

      await act(async () => {
        fireEvent.change(barcodeInput, { target: { value: 'STYLE-456' } });
        fireEvent.change(nameInput, { target: { value: 'Test Chair' } });
        fireEvent.change(urlInput, { target: { value: 'https://example.com/chair.jpg' } });
      });

      const assignButton = findTextContent(container, 'Assign Barcode');
      await act(async () => {
        fireEvent.click(assignButton);
      });

      expect(barcodeDatabase.addBarcode).toHaveBeenCalledWith('STYLE-456', {
        id: 'STYLE-456',
        type: 'style',
        name: 'Test Chair',
        imageUrl: 'https://example.com/chair.jpg',
      });
    });

    test('shows success message after assignment', async () => {
      const { container } = render(<BarcodeAdmin />);

      // Fill in form
      const barcodeInput = findInputByPlaceholder(container, 'STYLE-001');
      const nameInput = findInputByPlaceholder(container, 'Modern Sectional Sofa');
      const urlInput = findInputByPlaceholder(container, 'https://example.com/image.jpg');

      await act(async () => {
        fireEvent.change(barcodeInput, { target: { value: 'STYLE-789' } });
        fireEvent.change(nameInput, { target: { value: 'Test Ottoman' } });
        fireEvent.change(urlInput, { target: { value: 'https://example.com/ottoman.jpg' } });
      });

      const assignButton = findTextContent(container, 'Assign Barcode');
      await act(async () => {
        fireEvent.click(assignButton);
      });

      expect(container.textContent).toContain('Successfully assigned');
      expect(container.textContent).toContain('STYLE-789');
    });

    test('clears form after successful assignment', async () => {
      const { container } = render(<BarcodeAdmin />);

      // Fill in form
      const barcodeInput = findInputByPlaceholder(container, 'STYLE-001');
      const nameInput = findInputByPlaceholder(container, 'Modern Sectional Sofa');
      const urlInput = findInputByPlaceholder(container, 'https://example.com/image.jpg');

      await act(async () => {
        fireEvent.change(barcodeInput, { target: { value: 'STYLE-111' } });
        fireEvent.change(nameInput, { target: { value: 'Test Item' } });
        fireEvent.change(urlInput, { target: { value: 'https://example.com/item.jpg' } });
      });

      const assignButton = findTextContent(container, 'Assign Barcode');
      await act(async () => {
        fireEvent.click(assignButton);
      });

      // Form should be cleared
      expect(barcodeInput.value).toBe('');
      expect(nameInput.value).toBe('');
      expect(urlInput.value).toBe('');
    });
  });

  describe('close button', () => {
    test('calls onClose when clicked', async () => {
      const onClose = jest.fn();
      const { container } = render(<BarcodeAdmin onClose={onClose} />);

      const closeButton = findTextContent(container, 'Close');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('material type assignment', () => {
    test('assigns with material type correctly', async () => {
      const onAssign = jest.fn();
      const { container } = render(<BarcodeAdmin onAssign={onAssign} />);

      // Switch to material type
      const materialButton = findTextContent(container, 'Material (Fabric)');
      await act(async () => {
        fireEvent.click(materialButton);
      });

      // Fill in form
      const barcodeInput = findInputByPlaceholder(container, 'MAT-001');
      const nameInput = findInputByPlaceholder(container, 'Grey Linen Fabric');
      const urlInput = findInputByPlaceholder(container, 'https://example.com/image.jpg');

      await act(async () => {
        fireEvent.change(barcodeInput, { target: { value: 'MAT-555' } });
        fireEvent.change(nameInput, { target: { value: 'Blue Velvet' } });
        fireEvent.change(urlInput, { target: { value: 'https://example.com/velvet.jpg' } });
      });

      const assignButton = findTextContent(container, 'Assign Barcode');
      await act(async () => {
        fireEvent.click(assignButton);
      });

      expect(onAssign).toHaveBeenCalledWith({
        id: 'MAT-555',
        type: 'material',
        name: 'Blue Velvet',
        imageUrl: 'https://example.com/velvet.jpg',
      });
    });
  });
});
