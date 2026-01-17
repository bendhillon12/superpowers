# Furniture Visualizer

A mobile-first furniture visualization app that allows users to scan barcodes on furniture and materials, then uses AI to generate realistic previews of how different fabrics would look on the furniture.

## Features

- 📷 **Barcode Scanning** - Scan furniture style and material barcodes using device camera
- 🛋️ **Style Management** - Load and preview furniture pieces (sofas, couches)
- 🎨 **Material Swapping** - Apply different materials to furniture in real-time
- 🤖 **AI Generation** - Powered by Google Gemini (Nano Banana Pro)
- 📱 **Multi-Platform** - Runs on web and Android (via Expo)

## User Workflow

1. **Scan Style** - Point camera at furniture barcode (e.g., STYLE-001)
2. **Scan Material** - Point camera at fabric/material barcode (e.g., MAT-001)
3. **View Result** - AI generates visualization of furniture with new material
4. **Try More** - Scan additional materials while keeping the same style

The app remembers your selected furniture style, so you can quickly preview multiple materials without re-scanning the furniture.

## Tech Stack

- **Framework**: Expo (React Native for Web + Android)
- **Camera**: expo-camera, expo-barcode-scanner
- **AI**: Google Generative AI (@google/generative-ai)
- **Testing**: Jest, React Testing Library
- **State**: React Hooks (custom useFurnitureState hook)

## Project Structure

```
furniture-visualizer/
├── src/
│   ├── components/
│   │   └── BarcodeScanner.jsx      # Camera barcode scanner UI
│   ├── services/
│   │   ├── barcodeDatabase.js      # Barcode lookup service
│   │   └── geminiApi.js            # AI image generation service
│   ├── hooks/
│   │   └── useFurnitureState.js    # State management hook
│   └── __tests__/                  # Test files (24 tests, all passing)
├── data/
│   └── barcodes.json               # Barcode data (styles & materials)
├── App.js                          # Main app component
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI (`npm install -g expo-cli`)
- For Android: Android Studio or Expo Go app
- Google Gemini API key (optional - app uses mock mode by default)

### Installation

```bash
cd furniture-visualizer
npm install
```

### Running the App

**Web (for development):**
```bash
npm run web
```

**Android:**
```bash
npm run android
```

**iOS (requires macOS):**
```bash
npm run ios
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage**: 24/24 tests passing
- Barcode database validation & retrieval
- State management (style/material/image tracking)
- Workflow scenarios (scan style → scan multiple materials)

## Barcode Format

The app uses a simple barcode format:

- **Furniture Styles**: `STYLE-###` (e.g., STYLE-001, STYLE-123)
- **Materials**: `MAT-###` (e.g., MAT-001, MAT-999)

Where `###` is at least 3 digits.

### Sample Barcodes

Included for testing:

| Barcode | Type | Name |
|---------|------|------|
| STYLE-001 | Style | Modern Sectional Sofa |
| MAT-001 | Material | Grey Linen Fabric |

## Adding New Barcodes

Currently, barcodes are stored in `data/barcodes.json`:

```json
{
  "STYLE-002": {
    "id": "STYLE-002",
    "type": "style",
    "name": "Classic Chesterfield Sofa",
    "imageUrl": "/images/styles/chesterfield.jpg"
  },
  "MAT-002": {
    "id": "MAT-002",
    "type": "material",
    "name": "Navy Velvet",
    "imageUrl": "/images/materials/navy-velvet.jpg"
  }
}
```

**Future Enhancement**: Admin panel for barcode assignment will be added to make this easier.

## AI Image Generation

The app is designed to integrate with Google Gemini's Nano Banana Pro for realistic material swapping.

**Current Status**: Uses mock generation (simulated API response)

**To Enable Real AI:**

1. Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Update `src/services/geminiApi.js` to use real API instead of mock

**Note**: Actual image generation may require Imagen API integration (not just text-based Gemini). The architecture supports this - just swap the service implementation.

## Development Approach

This app was built using **Test-Driven Development (TDD)**:

1. ✅ Write tests first (RED)
2. ✅ Implement features (GREEN)
3. ✅ Refactor as needed

### Test Results

```
Test Suites: 2 passed, 2 total
Tests:       24 passed, 24 total
```

**Coverage:**
- `barcodeDatabase.js` - 11 tests
- `useFurnitureState.js` - 13 tests

## Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

### Web Deployment

```bash
# Build for web
npx expo export --platform web

# Deploy to hosting (Vercel, Netlify, etc.)
# The build output is in 'dist' folder
```

## Design Documents

Full design and implementation plans available in:
- `/docs/plans/2026-01-17-furniture-visualizer-design.md`
- `/docs/plans/2026-01-17-furniture-visualizer-plan.md`

## Future Enhancements

- [ ] Admin panel for barcode assignment
- [ ] Real Imagen API integration for actual image generation
- [ ] Image upload for furniture/materials (alternative to barcodes)
- [ ] Save/share visualizations
- [ ] Multiple camera mode improvements
- [ ] Offline mode with cached results
- [ ] User accounts and cloud sync
- [ ] AR preview mode (try furniture in your room)

## Troubleshooting

**Camera not working on web:**
- Web browsers require HTTPS for camera access
- Use `npx expo start --web --https` for local HTTPS

**Barcode not scanning:**
- Ensure good lighting
- Hold phone steady
- Barcode should be within the green frame
- Try different distances (6-12 inches usually works best)

**Tests failing:**
- Clear cache: `npm test -- --clearCache`
- Reinstall: `rm -rf node_modules && npm install`

## License

MIT

## Support

For issues or questions, create an issue in the repository.

---

Built with ❤️ using Expo and Google Gemini AI
