# Furniture Visualizer

A mobile-first furniture visualization app that allows users to scan barcodes on furniture and materials, then uses AI to generate realistic descriptions and previews of how different fabrics would look on the furniture.

## Features

- 📷 **Barcode Scanning** - Scan furniture style and material barcodes using device camera
- 🛋️ **Style Management** - Load and preview furniture pieces (sofas, chairs, loveseats)
- 🎨 **Material Swapping** - Apply different materials to furniture in real-time
- 🤖 **AI-Powered Descriptions** - Powered by Claude API for rich visualizations
- 🔧 **Admin Panel** - Built-in barcode management interface
- 💾 **Persistent Storage** - Save custom barcodes and scan history
- ⚠️ **Error Boundaries** - Graceful error handling throughout the app
- 📱 **Multi-Platform** - Runs on web, iOS, and Android (via Expo)

## User Workflow

1. **Scan Style** - Point camera at furniture barcode (e.g., STYLE-001)
2. **Scan Material** - Point camera at fabric/material barcode (e.g., MAT-001)
3. **View Result** - AI generates a detailed visualization description
4. **Try More** - Scan additional materials while keeping the same style

The app remembers your selected furniture style, so you can quickly preview multiple materials without re-scanning the furniture.

## Tech Stack

- **Framework**: Expo 54 (React Native for Web + iOS + Android)
- **Camera**: expo-camera, expo-barcode-scanner
- **AI**: Claude API (@anthropic-ai/sdk) with Gemini API fallback
- **Storage**: AsyncStorage for persistence
- **Testing**: Jest 30, React Testing Library
- **State**: React Hooks (custom useFurnitureState hook)

## Project Structure

```
furniture-visualizer/
├── src/
│   ├── components/
│   │   ├── BarcodeScanner.jsx    # Camera barcode scanner UI
│   │   ├── BarcodeAdmin.jsx      # Admin panel for barcode management
│   │   └── ErrorBoundary.js      # Error boundary component
│   ├── services/
│   │   ├── barcodeDatabase.js    # Barcode lookup service
│   │   ├── claudeApi.js          # Claude AI integration
│   │   ├── geminiApi.js          # Gemini AI integration
│   │   └── storage.js            # AsyncStorage persistence
│   ├── hooks/
│   │   └── useFurnitureState.js  # State management hook
│   └── __tests__/                # 130 tests, all passing
├── App.js                        # Main app component
├── .env.example                  # Environment variable template
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- For mobile: Expo Go app or development build
- For Android: Android Studio (optional)
- For iOS: Xcode on macOS (optional)

### Installation

```bash
cd furniture-visualizer
npm install
```

### Environment Setup

Copy the environment template and add your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Required for AI-powered descriptions
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: For image generation (coming soon)
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: The app works without API keys using enhanced mock descriptions.

### Running the App

**Development (with Expo Go):**
```bash
npx expo start
```

**Web:**
```bash
npm run web
# or
npx expo start --web
```

**Android:**
```bash
npm run android
# or
npx expo start --android
```

**iOS (requires macOS):**
```bash
npm run ios
# or
npx expo start --ios
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

**Test Coverage**: 130/130 tests passing

| Test Suite | Tests | Status |
|------------|-------|--------|
| barcodeDatabase | 20 | ✅ |
| claudeApi | 19 | ✅ |
| geminiApi | 18 | ✅ |
| storage | 22 | ✅ |
| useFurnitureState | 13 | ✅ |
| BarcodeScanner | 11 | ✅ |
| BarcodeAdmin | 19 | ✅ |
| ErrorBoundary | 8 | ✅ |

## Barcode Format

The app uses a simple barcode format:

- **Furniture Styles**: `STYLE-###` (e.g., STYLE-001, STYLE-005)
- **Materials**: `MAT-###` (e.g., MAT-001, MAT-006)

Where `###` is at least 3 digits.

### Pre-loaded Barcodes

**Furniture Styles:**
| Barcode | Name | Description |
|---------|------|-------------|
| STYLE-001 | Modern Sectional Sofa | L-shaped contemporary sectional |
| STYLE-002 | Classic Chesterfield Sofa | Traditional tufted sofa |
| STYLE-003 | Mid-Century Armchair | Retro-inspired chair |
| STYLE-004 | Scandinavian Loveseat | Minimalist two-seater |
| STYLE-005 | Leather Recliner | Power recliner with headrest |

**Materials:**
| Barcode | Name | Description |
|---------|------|-------------|
| MAT-001 | Grey Linen Fabric | Natural linen in neutral grey |
| MAT-002 | Navy Blue Velvet | Rich velvet in deep navy |
| MAT-003 | Cognac Leather | Premium full-grain leather |
| MAT-004 | Emerald Green Velvet | Luxurious jewel-tone green |
| MAT-005 | Cream Boucle | Textured fabric in soft cream |
| MAT-006 | Charcoal Tweed | Classic wool tweed |

## Admin Panel

The BarcodeAdmin component allows you to:
- Add new furniture styles and materials
- Assign barcodes to items
- Preview existing entries
- Manage the barcode database

Access via the "Admin" button in the app.

## AI Integration

### Claude API (Primary)

The app uses Claude API for intelligent furniture visualization descriptions:

```javascript
import { generateWithClaudeOrMock } from './src/services/claudeApi';

const result = await generateWithClaudeOrMock(
  'Modern Sectional Sofa',
  'Grey Linen Fabric',
  process.env.ANTHROPIC_API_KEY
);
```

### Gemini API (Fallback/Future)

Gemini integration is available for future image generation capabilities.

## Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build preview APK
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production
```

### iOS App

```bash
# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

### Web Deployment

```bash
# Build for web
npx expo export --platform web

# Output is in 'dist' folder
# Deploy to Vercel, Netlify, or any static host
```

**Deploying to Vercel:**
```bash
npm install -g vercel
npx expo export --platform web
cd dist
vercel
```

**Deploying to Netlify:**
```bash
npx expo export --platform web
# Drag 'dist' folder to Netlify dashboard
# Or use Netlify CLI: netlify deploy --dir=dist --prod
```

### Local Hosting

For local network access (e.g., testing on phones):

```bash
# Start with tunnel for external access
npx expo start --tunnel

# Or use local network
npx expo start --lan
```

## Troubleshooting

**Camera not working on web:**
- Web browsers require HTTPS for camera access
- Use `npx expo start --web --https` for local HTTPS
- Or deploy to HTTPS-enabled host

**Barcode not scanning:**
- Ensure good lighting
- Hold phone steady
- Barcode should be within the green frame
- Try different distances (6-12 inches works best)

**API errors:**
- Check that ANTHROPIC_API_KEY is set correctly in .env
- Verify API key is valid at console.anthropic.com
- App falls back to mock mode if API fails

**Tests failing:**
- Clear cache: `npm test -- --clearCache`
- Reinstall: `rm -rf node_modules && npm install`
- Check Node version: requires Node 18+

## Development Approach

This app was built using **Test-Driven Development (TDD)**:

1. ✅ Write tests first (RED)
2. ✅ Implement features (GREEN)
3. ✅ Refactor as needed

## Future Enhancements

- [ ] Real image generation via Gemini Imagen API
- [ ] Image upload for furniture/materials (alternative to barcodes)
- [ ] Save/share visualizations
- [ ] Offline mode with cached results
- [ ] User accounts and cloud sync
- [ ] AR preview mode (try furniture in your room)
- [ ] Dark mode support
- [ ] Multiple language support

## License

MIT

## Support

For issues or questions, create an issue in the repository.

---

Built with Expo and Claude AI
