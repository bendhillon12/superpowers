import { GoogleGenerativeAI } from '@google/generative-ai';

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
 * Converts image URL to base64
 * Works with both local and remote images
 *
 * @param {string} url - Image URL
 * @returns {Promise<string>} - Base64 encoded image
 */
async function imageUrlToBase64(url) {
  try {
    // For local images, we'd need to load them differently
    // For now, assume URL is accessible
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
}

/**
 * Generates a new furniture image with swapped material using Gemini AI
 *
 * @param {string} apiKey - Google Gemini API key
 * @param {string} styleImageUrl - URL of the furniture style image
 * @param {string} materialImageUrl - URL of the material texture image
 * @returns {Promise<string>} - Generated image data URL or description
 */
export async function generateMaterialSwap(apiKey, styleImageUrl, materialImageUrl) {
  if (!validateApiKey(apiKey)) {
    throw new Error('API key is required');
  }

  if (!styleImageUrl || !materialImageUrl) {
    throw new Error('Both style and material images are required');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 2.0 Flash for image understanding and generation
    // Note: Gemini models can analyze images but may not generate them directly
    // For actual image generation, we'd use Imagen or a different approach
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // For now, we'll use text-based analysis
    // In production, this would integrate with Imagen API or similar
    const prompt = `You are analyzing furniture and materials for visualization.

TASK: Describe how to realistically apply the material texture to the furniture piece.

FURNITURE STYLE: ${styleImageUrl}
MATERIAL TEXTURE: ${materialImageUrl}

Provide a detailed description of:
1. The furniture piece (shape, structure, current upholstery)
2. The material texture (color, pattern, fabric type)
3. How the final result would look with the material applied

Be specific about lighting, shadows, and how the material would drape or fit on the furniture.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();

    // Return description for now
    // In production with actual image generation:
    // - Would call Imagen API or similar
    // - Return actual generated image URL
    return {
      type: 'description',
      content: description,
      note: 'Image generation requires Imagen API integration. This is a text description of the result.'
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate material swap: ${error.message}`);
  }
}

/**
 * Mock function for testing/demo purposes
 * Simulates image generation without actual API call
 *
 * @param {string} styleName - Name of furniture style
 * @param {string} materialName - Name of material
 * @returns {Promise<Object>} - Mock generated result
 */
export async function mockGenerateMaterialSwap(styleName, materialName) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    type: 'mock',
    content: `Generated visualization: ${styleName} with ${materialName} material applied.`,
    mockImageUrl: 'https://via.placeholder.com/800x600/cccccc/333333?text=Generated+Result',
    note: 'This is a mock result. Enable Gemini API for real generation.'
  };
}
