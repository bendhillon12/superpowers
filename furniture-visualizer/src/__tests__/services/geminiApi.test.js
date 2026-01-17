import {
  validateApiKey,
  generateMaterialSwap,
  mockGenerateMaterialSwap,
} from '../../services/geminiApi';

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Generated description of furniture with new material applied.',
        },
      }),
    }),
  })),
}));

describe('geminiApi', () => {
  describe('validateApiKey', () => {
    test('returns true for valid API key', () => {
      expect(validateApiKey('valid-api-key-12345')).toBe(true);
    });

    test('returns true for any non-empty string', () => {
      expect(validateApiKey('a')).toBe(true);
      expect(validateApiKey('some-key')).toBe(true);
      expect(validateApiKey('AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx')).toBe(true);
    });

    test('returns falsy for empty string', () => {
      expect(validateApiKey('')).toBeFalsy();
    });

    test('returns falsy for null', () => {
      expect(validateApiKey(null)).toBeFalsy();
    });

    test('returns falsy for undefined', () => {
      expect(validateApiKey(undefined)).toBeFalsy();
    });

    test('returns falsy for non-string types', () => {
      expect(validateApiKey(12345)).toBeFalsy();
      expect(validateApiKey({})).toBeFalsy();
      expect(validateApiKey([])).toBeFalsy();
      expect(validateApiKey(true)).toBeFalsy();
    });
  });

  describe('generateMaterialSwap', () => {
    describe('validation', () => {
      test('throws error when API key is missing', async () => {
        await expect(
          generateMaterialSwap(null, 'style.jpg', 'material.jpg')
        ).rejects.toThrow('API key is required');
      });

      test('throws error when API key is empty', async () => {
        await expect(
          generateMaterialSwap('', 'style.jpg', 'material.jpg')
        ).rejects.toThrow('API key is required');
      });

      test('throws error when style image is missing', async () => {
        await expect(
          generateMaterialSwap('valid-key', null, 'material.jpg')
        ).rejects.toThrow('Both style and material images are required');
      });

      test('throws error when material image is missing', async () => {
        await expect(
          generateMaterialSwap('valid-key', 'style.jpg', null)
        ).rejects.toThrow('Both style and material images are required');
      });

      test('throws error when both images are missing', async () => {
        await expect(
          generateMaterialSwap('valid-key', null, null)
        ).rejects.toThrow('Both style and material images are required');
      });
    });

    describe('successful generation', () => {
      test('returns description object on success', async () => {
        const result = await generateMaterialSwap(
          'valid-api-key',
          'https://example.com/style.jpg',
          'https://example.com/material.jpg'
        );

        expect(result).toHaveProperty('type', 'description');
        expect(result).toHaveProperty('content');
        expect(result.content).toBe('Generated description of furniture with new material applied.');
        expect(result).toHaveProperty('note');
      });

      test('result note explains image generation limitation', async () => {
        const result = await generateMaterialSwap(
          'valid-api-key',
          'https://example.com/style.jpg',
          'https://example.com/material.jpg'
        );

        expect(result.note).toContain('Imagen API');
      });
    });
  });

  describe('mockGenerateMaterialSwap', () => {
    test('returns mock result with expected structure', async () => {
      const result = await mockGenerateMaterialSwap('Modern Sofa', 'Grey Linen');

      expect(result).toHaveProperty('type', 'mock');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('mockImageUrl');
      expect(result).toHaveProperty('note');
    });

    test('includes style and material names in content', async () => {
      const result = await mockGenerateMaterialSwap('Sectional', 'Blue Velvet');

      expect(result.content).toContain('Sectional');
      expect(result.content).toContain('Blue Velvet');
    });

    test('returns valid placeholder image URL', async () => {
      const result = await mockGenerateMaterialSwap('Chair', 'Leather');

      expect(result.mockImageUrl).toContain('placeholder.com');
    });

    test('simulates API delay', async () => {
      const startTime = Date.now();
      await mockGenerateMaterialSwap('Couch', 'Cotton');
      const endTime = Date.now();

      // Should take at least 1 second (1500ms delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    }, 10000);

    test('note indicates mock mode', async () => {
      const result = await mockGenerateMaterialSwap('Ottoman', 'Suede');

      expect(result.note).toContain('mock');
    });
  });
});
