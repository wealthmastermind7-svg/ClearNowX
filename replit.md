# ClearNowX - iPhone Storage Cleaner

## Overview
ClearNowX is a premium iOS-first utility app that helps users identify and clean storage space. Built with Expo and React Native, featuring glassmorphism design, haptic feedback, and 60fps animations.

## Tech Stack
- **Frontend**: Expo SDK 54, React Native, TypeScript
- **Navigation**: React Navigation 7+ (Native Stack)
- **Animations**: React Native Reanimated (60fps)
- **Effects**: expo-blur (glassmorphism), expo-haptics
- **State**: React Query for server state

## Visual Design System
- **Background**: Deep graphite black (#0B0C0F)
- **Accent**: Neon ice blue (#7DF9FF)
- **Glass Cards**: White with 20% opacity + blur radius 30
- **Typography**: Oversized numeric (64-96px for stats)

## App Flow
1. **Splash Screen** - App branding with animated entrance
2. **Scan Screen** - Animated progress ring with scanning simulation
3. **Results Screen** - Storage categories with locked premium state
4. **Paywall Screen** - Subscription options (Monthly $9.99, Annual $29.99, Weekly $4.99)
5. **Success Screen** - Celebration animation after unlock

## Project Structure
```
client/
├── App.tsx                    # Root component with providers
├── components/
│   ├── GlassCard.tsx          # Glassmorphism card component
│   ├── ProgressRing.tsx       # Animated circular progress
│   ├── PremiumButton.tsx      # Styled button with haptics
│   ├── ErrorBoundary.tsx      # Error handling wrapper
│   ├── ErrorFallback.tsx      # Error UI component
│   ├── ThemedText.tsx         # Theme-aware text
│   └── ThemedView.tsx         # Theme-aware view
├── constants/
│   └── theme.ts               # Design tokens (colors, spacing, typography)
├── navigation/
│   └── RootStackNavigator.tsx # Screen navigation configuration
├── screens/
│   ├── SplashScreen.tsx       # Entry splash animation
│   ├── ScanScreen.tsx         # Storage scanning simulation
│   ├── ResultsScreen.tsx      # Scan results with locked state
│   ├── PaywallScreen.tsx      # Subscription modal
│   └── SuccessScreen.tsx      # Post-unlock celebration
└── hooks/
    ├── useTheme.ts            # Theme access hook
    └── useScreenOptions.ts    # Navigation options hook
```

## Monetization (RevenueCat Integration)
- Entitlement detection: Checks for ANY active entitlement (not hardcoded ID)
- Products: clearnowx_monthly (7-day trial), clearnowx_annual, clearnowx_weekly
- PaywallScreen: Displays RevenueCat offerings dynamically using PACKAGE_TYPE enum
- Default: Monthly plan preselected (with 7-day trial badge)

### API Keys
- `EXPO_PUBLIC_REVENUECAT_API_KEY` - Production App Store key (used in production builds)
- `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` - Test Store key (used in Expo Go only)

### Environment Detection
- **Expo Go**: Uses Test Store API key, enables test mode for development
- **Production Build**: Uses Production API key, queries RevenueCat for real entitlements
- Apple Sandbox testing works automatically with production key

### RevenueCat Files
- `client/lib/revenuecat.ts` - SDK configuration and purchase functions
- `client/context/PremiumContext.tsx` - usePremium() hook provider
- `client/screens/PaywallScreen.tsx` - Custom paywall with glassmorphism UI

## Running the App
- Development: `npm run all:dev`
- Web preview available at localhost:8081
- Scan QR code for Expo Go testing on physical devices

## Recent Changes
- December 2024: Initial build with full glassmorphism UI
- Created all 5 core screens with animations
- Implemented haptic feedback system
- Added RevenueCat SDK integration with dynamic offerings
- Created custom PaywallScreen with PACKAGE_TYPE enum for reliable plan detection
