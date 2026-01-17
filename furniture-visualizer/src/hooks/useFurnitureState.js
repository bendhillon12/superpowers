import { useState, useCallback } from 'react';

/**
 * Custom hook to manage furniture visualization state
 *
 * Manages:
 * - Selected furniture style (sofa/couch)
 * - Selected material
 * - Generated image URL
 *
 * Key behavior:
 * - Changing style clears the generated image (new style needs new generation)
 * - Changing material keeps the style (same style, new material)
 *
 * @returns {Object} State and setter functions
 */
export function useFurnitureState() {
  const [selectedStyle, setSelectedStyleInternal] = useState(null);
  const [selectedMaterial, setSelectedMaterialInternal] = useState(null);
  const [generatedImage, setGeneratedImageInternal] = useState(null);

  /**
   * Sets the selected furniture style
   * Clears the generated image when style changes
   *
   * @param {Object|null} style - The style data or null to clear
   */
  const setSelectedStyle = useCallback((style) => {
    setSelectedStyleInternal(style);
    // Clear generated image when style changes
    // User needs to regenerate with new style
    setGeneratedImageInternal(null);
  }, []);

  /**
   * Sets the selected material
   * Does NOT clear generated image - that happens when material is applied
   *
   * @param {Object|null} material - The material data or null to clear
   */
  const setSelectedMaterial = useCallback((material) => {
    setSelectedMaterialInternal(material);
  }, []);

  /**
   * Sets the generated image URL
   *
   * @param {string|null} imageUrl - The generated image URL or null to clear
   */
  const setGeneratedImage = useCallback((imageUrl) => {
    setGeneratedImageInternal(imageUrl);
  }, []);

  return {
    // State
    selectedStyle,
    selectedMaterial,
    generatedImage,

    // Setters
    setSelectedStyle,
    setSelectedMaterial,
    setGeneratedImage,
  };
}
