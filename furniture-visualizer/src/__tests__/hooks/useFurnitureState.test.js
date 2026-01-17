import { renderHook, act } from '@testing-library/react';
import { useFurnitureState } from '../../hooks/useFurnitureState';

describe('useFurnitureState', () => {
  describe('initialization', () => {
    test('should initialize with null values', () => {
      const { result } = renderHook(() => useFurnitureState());

      expect(result.current.selectedStyle).toBeNull();
      expect(result.current.selectedMaterial).toBeNull();
      expect(result.current.generatedImage).toBeNull();
    });

    test('should provide setter functions', () => {
      const { result } = renderHook(() => useFurnitureState());

      expect(typeof result.current.setSelectedStyle).toBe('function');
      expect(typeof result.current.setSelectedMaterial).toBe('function');
      expect(typeof result.current.setGeneratedImage).toBe('function');
    });
  });

  describe('style management', () => {
    test('should update selected style', () => {
      const { result } = renderHook(() => useFurnitureState());
      const styleData = {
        id: 'STYLE-001',
        name: 'Modern Sectional',
        type: 'style',
        imageUrl: '/images/styles/modern-sectional.jpg'
      };

      act(() => {
        result.current.setSelectedStyle(styleData);
      });

      expect(result.current.selectedStyle).toEqual(styleData);
    });

    test('should clear generated image when style changes', () => {
      const { result } = renderHook(() => useFurnitureState());
      const style1 = { id: 'STYLE-001', name: 'Sofa 1' };
      const style2 = { id: 'STYLE-002', name: 'Sofa 2' };

      act(() => {
        result.current.setSelectedStyle(style1);
        result.current.setGeneratedImage('generated-image-url');
      });

      expect(result.current.generatedImage).toBe('generated-image-url');

      act(() => {
        result.current.setSelectedStyle(style2);
      });

      expect(result.current.selectedStyle).toEqual(style2);
      expect(result.current.generatedImage).toBeNull();
    });

    test('should allow clearing style by setting to null', () => {
      const { result } = renderHook(() => useFurnitureState());
      const styleData = { id: 'STYLE-001' };

      act(() => {
        result.current.setSelectedStyle(styleData);
      });

      expect(result.current.selectedStyle).toEqual(styleData);

      act(() => {
        result.current.setSelectedStyle(null);
      });

      expect(result.current.selectedStyle).toBeNull();
    });
  });

  describe('material management', () => {
    test('should update selected material', () => {
      const { result } = renderHook(() => useFurnitureState());
      const materialData = {
        id: 'MAT-001',
        name: 'Grey Linen',
        type: 'material',
        imageUrl: '/images/materials/grey-linen.jpg'
      };

      act(() => {
        result.current.setSelectedMaterial(materialData);
      });

      expect(result.current.selectedMaterial).toEqual(materialData);
    });

    test('should keep style when material changes', () => {
      const { result } = renderHook(() => useFurnitureState());
      const styleData = { id: 'STYLE-001', name: 'Sofa' };
      const material1 = { id: 'MAT-001', name: 'Material 1' };
      const material2 = { id: 'MAT-002', name: 'Material 2' };

      act(() => {
        result.current.setSelectedStyle(styleData);
        result.current.setSelectedMaterial(material1);
      });

      expect(result.current.selectedStyle).toEqual(styleData);
      expect(result.current.selectedMaterial).toEqual(material1);

      act(() => {
        result.current.setSelectedMaterial(material2);
      });

      expect(result.current.selectedStyle).toEqual(styleData);
      expect(result.current.selectedMaterial).toEqual(material2);
    });

    test('should allow clearing material by setting to null', () => {
      const { result } = renderHook(() => useFurnitureState());
      const materialData = { id: 'MAT-001' };

      act(() => {
        result.current.setSelectedMaterial(materialData);
      });

      expect(result.current.selectedMaterial).toEqual(materialData);

      act(() => {
        result.current.setSelectedMaterial(null);
      });

      expect(result.current.selectedMaterial).toBeNull();
    });
  });

  describe('generated image management', () => {
    test('should update generated image', () => {
      const { result } = renderHook(() => useFurnitureState());
      const imageUrl = 'https://example.com/generated.jpg';

      act(() => {
        result.current.setGeneratedImage(imageUrl);
      });

      expect(result.current.generatedImage).toBe(imageUrl);
    });

    test('should not clear style or material when generated image is set', () => {
      const { result } = renderHook(() => useFurnitureState());
      const styleData = { id: 'STYLE-001' };
      const materialData = { id: 'MAT-001' };

      act(() => {
        result.current.setSelectedStyle(styleData);
        result.current.setSelectedMaterial(materialData);
        result.current.setGeneratedImage('generated-url');
      });

      expect(result.current.selectedStyle).toEqual(styleData);
      expect(result.current.selectedMaterial).toEqual(materialData);
      expect(result.current.generatedImage).toBe('generated-url');
    });

    test('should allow clearing generated image by setting to null', () => {
      const { result } = renderHook(() => useFurnitureState());

      act(() => {
        result.current.setGeneratedImage('image-url');
      });

      expect(result.current.generatedImage).toBe('image-url');

      act(() => {
        result.current.setGeneratedImage(null);
      });

      expect(result.current.generatedImage).toBeNull();
    });
  });

  describe('workflow scenarios', () => {
    test('should support scanning style then multiple materials', () => {
      const { result } = renderHook(() => useFurnitureState());
      const style = { id: 'STYLE-001' };
      const materials = [
        { id: 'MAT-001', name: 'Material 1' },
        { id: 'MAT-002', name: 'Material 2' },
        { id: 'MAT-003', name: 'Material 3' },
      ];

      // Scan style once
      act(() => {
        result.current.setSelectedStyle(style);
      });

      // Scan multiple materials - style should persist
      materials.forEach((material, index) => {
        act(() => {
          result.current.setSelectedMaterial(material);
          result.current.setGeneratedImage(`generated-${index}.jpg`);
        });

        expect(result.current.selectedStyle).toEqual(style);
        expect(result.current.selectedMaterial).toEqual(material);
        expect(result.current.generatedImage).toBe(`generated-${index}.jpg`);
      });
    });

    test('should reset workflow when new style is scanned', () => {
      const { result } = renderHook(() => useFurnitureState());
      const style1 = { id: 'STYLE-001' };
      const style2 = { id: 'STYLE-002' };
      const material = { id: 'MAT-001' };

      // First workflow
      act(() => {
        result.current.setSelectedStyle(style1);
        result.current.setSelectedMaterial(material);
        result.current.setGeneratedImage('generated-1.jpg');
      });

      // New style should clear generated image but keep material
      act(() => {
        result.current.setSelectedStyle(style2);
      });

      expect(result.current.selectedStyle).toEqual(style2);
      expect(result.current.selectedMaterial).toEqual(material);
      expect(result.current.generatedImage).toBeNull();
    });
  });
});
