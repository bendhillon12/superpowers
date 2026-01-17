import {
  validateApiKey,
  generateMaterialSwapWithClaude,
  generateWithClaudeOrMock,
} from '../../services/claudeApi';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'The Modern Sectional Sofa with Grey Linen Fabric would look stunning. The natural texture of the linen adds warmth while maintaining a contemporary aesthetic.',
          },
        ],
      }),
    },
  }));
});

describe('claudeApi', () => {
  describe('validateApiKey', () => {
    test('returns true for valid API key', () => {
      expect(validateApiKey('sk-ant-api03-xxxxx')).toBe(true);
    });

    test('returns true for any non-empty string', () => {
      expect(validateApiKey('a')).toBe(true);
      expect(validateApiKey('some-key')).toBe(true);
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
  });

  describe('generateMaterialSwapWithClaude', () => {
    describe('validation', () => {
      test('throws error when API key is missing', async () => {
        await expect(
          generateMaterialSwapWithClaude(null, 'Sofa', 'Linen')
        ).rejects.toThrow('API key is required');
      });

      test('throws error when style name is missing', async () => {
        await expect(
          generateMaterialSwapWithClaude('valid-key', null, 'Linen')
        ).rejects.toThrow('Both style name and material name are required');
      });

      test('throws error when material name is missing', async () => {
        await expect(
          generateMaterialSwapWithClaude('valid-key', 'Sofa', null)
        ).rejects.toThrow('Both style name and material name are required');
      });
    });

    describe('successful generation', () => {
      test('returns claude-description object on success', async () => {
        const result = await generateMaterialSwapWithClaude(
          'valid-api-key',
          'Modern Sectional Sofa',
          'Grey Linen Fabric'
        );

        expect(result).toHaveProperty('type', 'claude-description');
        expect(result).toHaveProperty('content');
        expect(result.content).toContain('stunning');
        expect(result).toHaveProperty('styleName', 'Modern Sectional Sofa');
        expect(result).toHaveProperty('materialName', 'Grey Linen Fabric');
        expect(result).toHaveProperty('mockImageUrl');
        expect(result).toHaveProperty('note');
      });

      test('includes style and material names in result', async () => {
        const result = await generateMaterialSwapWithClaude(
          'valid-key',
          'Chesterfield',
          'Velvet'
        );

        expect(result.styleName).toBe('Chesterfield');
        expect(result.materialName).toBe('Velvet');
      });

      test('generates placeholder image URL with names', async () => {
        const result = await generateMaterialSwapWithClaude(
          'valid-key',
          'Chair',
          'Leather'
        );

        expect(result.mockImageUrl).toContain('placeholder.com');
        expect(result.mockImageUrl).toContain('Chair');
        expect(result.mockImageUrl).toContain('Leather');
      });
    });
  });

  describe('generateWithClaudeOrMock', () => {
    describe('with API key', () => {
      test('uses Claude API when key is provided', async () => {
        const result = await generateWithClaudeOrMock(
          'Sofa',
          'Cotton',
          'valid-api-key'
        );

        expect(result.type).toBe('claude-description');
      });
    });

    describe('without API key', () => {
      test('returns enhanced-mock without API key', async () => {
        const result = await generateWithClaudeOrMock(
          'Chair',
          'Fabric',
          null
        );

        expect(result.type).toBe('enhanced-mock');
      });

      test('returns enhanced-mock with empty API key', async () => {
        const result = await generateWithClaudeOrMock(
          'Ottoman',
          'Suede',
          ''
        );

        expect(result.type).toBe('enhanced-mock');
      });

      test('includes style and material in mock result', async () => {
        const result = await generateWithClaudeOrMock(
          'Loveseat',
          'Microfiber'
        );

        expect(result.styleName).toBe('Loveseat');
        expect(result.materialName).toBe('Microfiber');
        expect(result.content).toBeTruthy();
      });

      test('returns specific description for known style/material combos', async () => {
        const result = await generateWithClaudeOrMock(
          'Modern Sectional Sofa',
          'Grey Linen Fabric'
        );

        expect(result.content).toContain('grey linen');
      });

      test('returns generic description for unknown combinations', async () => {
        const result = await generateWithClaudeOrMock(
          'Unknown Furniture',
          'Mystery Material'
        );

        expect(result.content).toContain('Unknown Furniture');
        expect(result.content).toContain('Mystery Material');
      });

      test('includes placeholder image URL', async () => {
        const result = await generateWithClaudeOrMock(
          'Bench',
          'Canvas'
        );

        expect(result.mockImageUrl).toContain('placeholder.com');
      });

      test('includes note about API key', async () => {
        const result = await generateWithClaudeOrMock(
          'Stool',
          'Vinyl'
        );

        expect(result.note).toContain('ANTHROPIC_API_KEY');
      });
    });
  });
});
