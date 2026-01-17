import Anthropic from '@anthropic-ai/sdk';

/**
 * Validates API key format
 *
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} - True if valid format
 */
export function validateApiKey(apiKey) {
  return apiKey && typeof apiKey === 'string' && apiKey.length > 0;
}

/**
 * Generates a furniture visualization description using Claude
 *
 * @param {string} apiKey - Anthropic API key
 * @param {string} styleName - Name of the furniture style
 * @param {string} materialName - Name of the material
 * @param {string} styleImageUrl - URL of the furniture style image (optional)
 * @param {string} materialImageUrl - URL of the material texture image (optional)
 * @returns {Promise<Object>} - Generated visualization result
 */
export async function generateMaterialSwapWithClaude(
  apiKey,
  styleName,
  materialName,
  styleImageUrl = null,
  materialImageUrl = null
) {
  if (!validateApiKey(apiKey)) {
    throw new Error('API key is required');
  }

  if (!styleName || !materialName) {
    throw new Error('Both style name and material name are required');
  }

  try {
    const client = new Anthropic({
      apiKey: apiKey,
    });

    const prompt = `You are an expert interior designer and furniture visualizer.

A customer wants to see how a "${styleName}" would look with "${materialName}" upholstery.

Please provide:
1. A vivid, detailed description of how the furniture would look with this material
2. How the material's texture, color, and pattern would appear on the furniture
3. How light would interact with the material on this furniture piece
4. Any design recommendations or considerations

Be specific, visual, and help the customer imagine the final result clearly.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const description = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate description';

    return {
      type: 'claude-description',
      content: description,
      styleName,
      materialName,
      mockImageUrl: `https://via.placeholder.com/800x600/8B4513/FFFFFF?text=${encodeURIComponent(styleName)}+with+${encodeURIComponent(materialName)}`,
      note: 'AI-generated description by Claude. Image generation will be available with Gemini API key.',
    };

  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Failed to generate visualization: ${error.message}`);
  }
}

/**
 * Mock function that uses Claude API if available, otherwise falls back to simple mock
 *
 * @param {string} styleName - Name of furniture style
 * @param {string} materialName - Name of material
 * @param {string} apiKey - Optional Anthropic API key
 * @returns {Promise<Object>} - Generated result
 */
export async function generateWithClaudeOrMock(styleName, materialName, apiKey = null) {
  // If API key provided, use Claude
  if (apiKey && validateApiKey(apiKey)) {
    return generateMaterialSwapWithClaude(apiKey, styleName, materialName);
  }

  // Fallback to enhanced mock with better descriptions
  await new Promise(resolve => setTimeout(resolve, 500));

  const descriptions = {
    'Modern Sectional Sofa': {
      'Grey Linen Fabric': 'The modern sectional sofa transforms beautifully with grey linen upholstery. The fabric\'s natural texture adds warmth while the neutral grey tone creates a sophisticated, contemporary look. Light plays softly across the woven surface, creating subtle shadows in the tufted sections.',
      'default': `The modern sectional sofa takes on a fresh character with ${materialName}. The clean lines of the sofa complement the material\'s texture, while the spacious seating area showcases the fabric\'s quality and drape.`
    },
    'default': {
      'default': `Visualizing ${styleName} with ${materialName}: The furniture piece would feature the material\'s distinctive characteristics, with the upholstery conforming to the furniture\'s contours. The result combines the furniture\'s structural design with the material\'s unique texture and color properties.`
    }
  };

  const styleDesc = descriptions[styleName] || descriptions['default'];
  const content = styleDesc[materialName] || styleDesc['default'];

  return {
    type: 'enhanced-mock',
    content: content.replace('${materialName}', materialName).replace('${styleName}', styleName),
    styleName,
    materialName,
    mockImageUrl: `https://via.placeholder.com/800x600/8B4513/FFFFFF?text=${encodeURIComponent(styleName)}+with+${encodeURIComponent(materialName)}`,
    note: 'Enhanced mock visualization. Add ANTHROPIC_API_KEY for AI-powered descriptions.',
  };
}
