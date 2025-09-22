# Campingplatz Navigation App - GitHub Copilot Instructions

**ALWAYS FOLLOW THESE INSTRUCTIONS FIRST.** Only fallback to additional search and context gathering if the information in these instructions is incomplete or found to be in error.

This is a React/TypeScript campground navigation app with Express backend, designed for Replit deployment. The app provides POI (Point of Interest) search, mapping, routing, weather information, and multilingual voice navigation for campgrounds in Germany and Netherlands.

## 🚀 Quick Setup & Development

### Prerequisites & Environment
- **Node.js**: 20.19.5+ (verified working)
- **Package Manager**: npm 10.8.2+ (verified working)
- **Platform**: Optimized for Replit but works locally
- **Required APIs**: Google Directions, OpenWeather, Mapbox (optional but recommended)

### Bootstrap Commands (Run in Order)
```bash
# 1. Install dependencies - 760 packages, takes ~30 seconds
npm install

# 2. Start development server - READY in ~8 seconds
npm run dev
# App runs on http://localhost:5000 (NOT 3000)

# 3. Verify TypeScript (OPTIONAL - has 217 known errors but app works)
npm run check
# Takes ~3 seconds, exits with code 1 due to known type issues
```

### Build & Deploy Commands
```bash
# Production build - NEVER CANCEL: Takes ~5 seconds, set timeout to 60+ minutes for safety
npm run build
# Creates: dist/index.html (0.67kB), dist/assets/*.css (115kB), dist/assets/*.js (674kB)

# Production server
npm start
# Uses built assets from dist/ directory
```

## ⚠️ CRITICAL TIMING INFORMATION

- **NEVER CANCEL builds or long-running commands** - Always wait for completion
- **npm install**: ~30 seconds (verified timing)
- **npm run build**: ~5 seconds (verified timing) - Set 60+ minute timeout anyway
- **npm run check**: ~3 seconds, always exits with errors (this is expected)
- **npm run dev**: ~8 seconds to server ready
- **Database operations**: Will fail without DATABASE_URL (this is normal)

## 🔧 Environment Variables & Configuration

### Required for Full Functionality
```bash
# API Keys (app gracefully degrades without these)
GOOGLE_DIRECTIONS_API_KEY=your_google_key    # Routing fallback
OPENWEATHER_API_KEY=your_openweather_key     # Weather data
MAPBOX_TOKEN=your_mapbox_token               # Map tiles & server-side
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token   # Client-side mapping

# Optional Database
DATABASE_URL=postgresql://...                # Neon/PostgreSQL support

# Optional Features
ELEVENLABS_API_KEY=your_elevenlabs_key       # Enhanced TTS (optional)
```

### Replit-Specific Setup
- Use **Replit Secrets panel** for environment variables (not .env files)
- App automatically detects Replit environment via `process.env.REPL_ID`
- Uses special Replit Vite plugins for enhanced development experience

## 🏗️ Project Architecture

### Frontend Stack
- **React 18.3.1** with TypeScript (strict mode enabled)
- **Vite 5.4.14** for development and building
- **TanStack Query v5** for server state management
- **Wouter** for lightweight client-side routing
- **Shadcn/UI + Radix UI** for accessible components
- **Tailwind CSS** for styling with Glassmorphism design
- **Leaflet + React-Leaflet** for mapping (4 map styles: outdoors, satellite, streets, navigation)

### Backend Stack
- **Express.js 4.21.2** with TypeScript
- **ESBuild** for server compilation and bundling
- **Drizzle ORM** with PostgreSQL support (optional)
- **Sharp** for image processing
- **WebSocket support** for real-time features

### Key Directories
```
├── client/src/          # React frontend source
│   ├── components/      # UI components (Maps, Navigation, etc.)
│   ├── hooks/          # React hooks (usePOI, useWeather, etc.)
│   ├── lib/            # Utilities (routing, voice, i18n)
│   └── pages/          # Route pages (Navigation.tsx main page)
├── server/             # Express backend
│   ├── routes/         # API endpoints
│   ├── lib/            # Business logic (routing engines, POI transformers)
│   └── data/           # GeoJSON files for POI/routing data
├── shared/             # Shared TypeScript types and schemas
└── dist/               # Production build output
```

## 📡 API Endpoints & Services

### Core APIs
```typescript
// Main navigation APIs
GET  /api/pois?site=zuhause          // Get POIs for site
GET  /api/pois/search?q=restaurant   // Search POIs
POST /api/route/enhanced             // Smart routing with fallbacks
GET  /api/weather?lat=51.002&lng=6.051 // Current weather

// Debug & Testing
GET  /api/debug/*                    // Development debugging routes
GET  /api/network-status             // Network health check
```

### Test Sites
- **Zuhause/Gangelt** (Primary): 51.002°N, 6.051°E - German campground with full local routing
- **Kamperland/Roompot** (Secondary): 51.589°N, 3.721°E - Dutch campground for testing

## 🧪 Testing & Validation

### Manual Testing Scenarios
After making changes, ALWAYS test these scenarios:

1. **Basic App Load**:
   - Start dev server with `npm run dev`
   - Navigate to http://localhost:5000
   - Verify map loads with weather widget showing 20°C
   - Confirm 1297 POIs loaded for "zuhause" site

2. **Search Functionality**:
   - Type "restaurant" in search box
   - Verify 12 restaurant results appear on map
   - Click a POI marker to test interaction

3. **Build Validation**:
   - Run `npm run build` (wait for completion)
   - Run `npm start` to test production mode
   - Verify static assets serve correctly

### Known Issues (Do NOT Fix These)
- **TypeScript errors**: 217 errors in 45 files - app works despite these
- **Weather forecast API**: Returns 500 errors without API key - this is expected
- **Map tiles**: Some tile loading errors in development - app still functional
- **Database commands**: `npm run db:push` fails without DATABASE_URL - normal behavior

## 🌍 Internationalization & Features

### Supported Languages
- **Deutsch (de)** - Primary language with native street names
- **English (en)** - Full localization
- **Français (fr), Nederlands (nl), Italiano (it), Español (es)** - Complete support

### Voice Navigation
- Uses browser-native SpeechSynthesis API
- Automatic language detection from browser settings
- German voice instructions for local campground navigation
- Fallback to ElevenLabs API when configured

### Key Features
- **Real-time GPS tracking** with mock mode for development
- **Offline-capable routing** using local GeoJSON data
- **Weather integration** with current conditions and alerts
- **POI categorization**: 8 categories (Verkehr, Gastronomie, Übernachten, etc.)
- **Adaptive UI modes**: Search, POI info, route planning, navigation

## 🔍 Development Workflows

### Adding New Features
1. **Frontend changes**: Edit files in `client/src/`
2. **Backend APIs**: Add routes in `server/routes/`
3. **Shared types**: Update `shared/` directory
4. **Always test**: Use manual validation scenarios above

### Debugging
- **Console logs**: Extensive logging throughout app - use browser DevTools
- **Network tab**: Monitor API calls to `/api/*` endpoints
- **Server logs**: Watch console output from `npm run dev`

### Performance Notes
- **Large bundle warning**: 674kB JavaScript bundle is expected (contains map libraries)
- **Build chunks**: Consider dynamic imports for code splitting if needed
- **Memory usage**: Server logs memory stats every 60 seconds in development

## ⚡ Common Commands & Shortcuts

```bash
# Development
npm run dev              # Start dev server (port 5000)
npm run check           # TypeScript check (expect errors)

# Production
npm run build           # Build for production
npm start              # Run production server

# Database (requires DATABASE_URL)
npm run db:push         # Push schema changes

# Troubleshooting
pkill -f "tsx.*server"  # Kill hanging server processes
rm -rf dist node_modules/.cache  # Clean build cache
```

## 🚨 Important Warnings

- **NEVER use git reset or rebase** - Force push not available
- **NEVER cancel builds** - Always wait for completion even if they seem slow
- **NEVER fix TypeScript errors** unless specifically requested - app works with current errors
- **ALWAYS test search functionality** after POI-related changes
- **ALWAYS verify both dev and production modes** work after significant changes

## 📱 Validation Checklist

Before completing any task:
- [ ] `npm run dev` starts successfully and shows "Server ready at http://0.0.0.0:5000"
- [ ] App loads at http://localhost:5000 with map visible
- [ ] Search for "restaurant" returns 12 results with map markers
- [ ] Weather widget shows temperature (20°C in mock mode)
- [ ] `npm run build` completes successfully (~5 seconds)
- [ ] `npm start` serves production app correctly
- [ ] No new console errors beyond known issues

This campground navigation app is production-ready despite TypeScript warnings. Focus on functionality over type perfection.

Fixes #23.