# Furniture Visualizer App - Design Document

**Date:** 2026-01-17
**Status:** Design Phase

## Problem Statement

Create a furniture visualization app that allows users to:
1. Scan barcodes on furniture styles (sofas/couches) to load high-resolution product images
2. Scan barcodes on material samples to load material textures
3. Use AI (Google Nano Banana Pro) to regenerate the furniture image with the scanned material applied
4. Maintain the last scanned style so multiple materials can be previewed on the same furniture piece

## User Workflow

```
[Scan Style Button] → Barcode Scanner → Load Furniture Image → Display
                                                                    ↓
                                                    Store as "Current Style"
                                                                    ↓
[Scan Material Button] → Barcode Scanner → Load Material Texture → AI Regeneration → Display Result
                                                                    ↑
                                          Uses stored "Current Style" ────┘
```

## Technical Requirements

### Platform
- **Primary:** Web application (React/Expo web)
- **Secondary:** Android APK via Expo build
- **Compatibility:** Must work on mobile browsers and wrapped as native app

### Core Features

1. **Barcode Scanning**
   - Use device camera to scan barcodes
   - Support standard barcode formats (EAN-13, UPC-A, Code-128)
   - Real-time scanning feedback

2. **Image Management**
   - Store barcode-to-image mappings
   - Support high-resolution images (furniture styles and materials)
   - Barcode assignment tool for existing images

3. **AI Image Generation**
   - Integration with Google Gemini API (Nano Banana Pro)
   - Prompt engineering for material swapping on furniture
   - Handle API responses and error states

4. **State Management**
   - Remember last scanned furniture style
   - Clear separation between "style mode" and "material mode"
   - Display current style and material information

### Data Model

```javascript
{
  styles: {
    "barcode-12345": {
      id: "barcode-12345",
      name: "Modern Sectional Sofa",
      imageUrl: "/images/styles/modern-sectional.jpg",
      type: "sofa"
    }
  },
  materials: {
    "barcode-67890": {
      id: "barcode-67890",
      name: "Grey Linen Fabric",
      imageUrl: "/images/materials/grey-linen.jpg",
      type: "fabric"
    }
  },
  currentState: {
    selectedStyle: null,  // barcode ID
    selectedMaterial: null,  // barcode ID
    generatedImage: null  // URL or base64
  }
}
```

## Implementation Approach

### Option 1: Client-Side Database with Cloud Storage (Recommended)
**Pros:**
- Simple deployment (static hosting)
- No backend server required initially
- Fast local lookups
- Can add backend later for sync

**Cons:**
- Limited to single-device usage initially
- Images need to be bundled or CDN-hosted

**Tech Stack:**
- Expo (React Native Web)
- LocalStorage/IndexedDB for barcode mappings
- Expo Camera for barcode scanning
- Google Gemini API (Nano Banana Pro) for generation
- Cloudinary/Firebase Storage for images

### Option 2: Full-Stack with Backend
**Pros:**
- Multi-device sync
- Centralized barcode management
- Better image management
- User accounts possible

**Cons:**
- More complex deployment
- Requires hosting costs
- Longer development time

**Tech Stack:**
- Frontend: Expo (React Native Web)
- Backend: Node.js/Express or Firebase
- Database: PostgreSQL or Firebase Firestore
- Storage: AWS S3 or Firebase Storage
- Barcode scanning: Expo Camera
- AI: Google Gemini API

### Option 3: Hybrid Approach
**Pros:**
- Start simple, grow as needed
- Backend only for AI processing
- Local-first for speed

**Cons:**
- Split architecture complexity

## Recommended: Option 1 (MVP) → Option 3 (Scale)

Start with Option 1 for rapid development:
1. Local barcode database (JSON file)
2. Images stored in `/public/images/` or CDN
3. Direct Gemini API calls from client (with API key management)
4. Add backend later when scaling needed

## Key Technical Decisions

### Barcode Scanning Library
- **Choice:** `expo-barcode-scanner` or `react-native-camera`
- **Rationale:** Native Expo integration, supports web fallback

### Image Generation Strategy
- **Choice:** Google Gemini API (Nano Banana Pro)
- **API Endpoint:** `https://generativelanguage.googleapis.com/v1/models/gemini-3-pro-image`
- **Prompt Template:**
  ```
  "Replace the upholstery material on this [furniture type] with the provided [material type].
  Maintain the exact shape, structure, and lighting of the original furniture.
  Apply the new material texture realistically, preserving shadows and highlights.

  Original furniture: [base64 image]
  New material texture: [base64 image]"
  ```

### State Management
- **Choice:** React Context API or Zustand
- **Rationale:** Simple, no external dependencies for MVP

## Testing Strategy (TDD)

### Unit Tests
1. Barcode validation and parsing
2. Image URL resolution from barcode
3. State management (style/material selection)
4. API request formatting

### Integration Tests
1. Barcode scan → image load workflow
2. Style + Material → AI generation workflow
3. Error handling (invalid barcode, API failure)

### E2E Tests
1. Full user flow: scan style → scan material → view result
2. Multiple material scans with same style
3. Change style, scan new material

## Open Questions

1. **API Key Management:** How should we secure the Gemini API key?
   - Environment variables
   - Backend proxy (more secure)
   - User-provided keys

2. **Image Format/Size:** What resolution for source images?
   - Recommend: 2048x2048 max for balance
   - Gemini API limits to consider

3. **Offline Support:** Should the app work without internet?
   - Initial scan needs images (online)
   - AI generation always requires API (online)
   - Could cache previous generations

4. **Barcode Assignment Tool:** CLI or web-based?
   - Preference: Web-based admin panel for ease of use

## Next Steps

1. ✅ Create design document (this file)
2. Create detailed implementation plan
3. Set up test structure
4. Implement barcode scanning (TDD)
5. Implement image loading (TDD)
6. Integrate Gemini API (TDD)
7. Build UI components
8. Create barcode assignment tool
9. End-to-end testing
10. Deploy web version
11. Build Android APK via Expo
