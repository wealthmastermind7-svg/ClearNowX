# ClearNowX Design Guidelines

## Visual Design System

### Color Palette
- **Background**: Deep graphite black (#0B0C0F)
- **Glass Cards**: White with 20% opacity + blur radius 30
- **Accent Color**: Neon ice blue (#7DF9FF)
- **High contrast minimalism** throughout

### Typography
- **Primary Font**: Zayan Luxury Font for headings and numbers
- **Oversized numeric typography**: 64–96px for storage statistics
- **Style**: Bold, premium, Apple-native feel

### UI Style
- Frosted glass panels using expo-blur
- Subtle grain overlay
- iOS glassmorphism aesthetic
- Apple-style motion easing
- 60fps animations using react-native-reanimated
- High-end, expensive feel

## Screen Specifications

### 1. Splash / Entry Screen
- Full-screen blurred background
- App name in oversized Zayan Luxury typography
- Micro haptic on load
- Clean, minimal entry point

### 2. Storage Scan Screen
- Large circular progress ring animation (60fps)
- "Scanning Storage…" animated text
- Strong haptic when scan starts
- Simulated scan progress animation
- Smooth, reassuring experience

### 3. Results Screen (LOCKED STATE)
- Glass cards displaying:
  - Reclaimable space
  - Duplicate photos
  - Large videos
- Numeric stats visible but actions disabled
- Action buttons blurred and disabled
- Subtle pulsing lock icon overlay
- Creates urgency to unlock premium features

### 4. Paywall Screen
- Full-screen glassmorphism modal
- Slide-up animation with blur intensification
- **Headline**: "Free up space in under 60 seconds"
- **Subscription Plans**:
  - **Monthly**: $9.99 (7-day free trial, default selected)
  - **Annual**: $29.99 (with "Best Value" badge)
  - **Weekly**: $4.99 (under "More options")
- Haptic feedback on plan selection
- Clear, compelling value proposition
- RevenueCat purchase flow integration

### 5. Success Screen
- Celebration animation
- Strong success haptic
- "Cleaning Complete" message
- Satisfying completion experience

## Interaction Design

### Haptic Feedback Patterns
- **Light haptic**: General tap interactions
- **Medium haptic**: Scan start
- **Heavy haptic**: Unlock success and cleaning complete
- **Rule**: No vibration spam—intentional, meaningful feedback only

### Animation Standards
- All animations must run at 60fps
- Smooth card entrance transitions
- Button press scale animation
- Progress ring animations
- Paywall slide-up with blur intensification
- Apple-style easing curves throughout

### Touch Feedback
- Visual scale animation on button press
- Immediate response to all interactions
- Haptic reinforcement for key actions

## Navigation Architecture
- Linear flow: Splash → Scan → Results → Paywall → Success
- Full-screen modal for paywall
- No complex navigation—streamlined single-purpose flow

## Monetization & Entitlements

### RevenueCat Integration
- **Single entitlement**: `premium_access`
- **Product IDs**:
  - `clearnowx_monthly` (7-day free trial)
  - `clearnowx_annual` (no trial)
  - `clearnowx_weekly` (no trial)

### Gated Features
- Cleaning actions
- Deletion capabilities
- Repeated scans
- All locked behind premium_access entitlement

## Platform Configuration
- **iOS-only** configuration
- Optimized for iPhone
- Apple-native feel and compliance
- No Android or web targets

## Design Principles
1. **Premium First**: App must feel expensive and high-end
2. **Speed & Decisiveness**: Fast interactions, immediate feedback
3. **No Placeholder UI**: Everything launch-ready and polished
4. **Apple Standards**: Follow iOS Human Interface Guidelines
5. **Minimal Friction**: Clear path from scan to purchase to success