# RevenueCat Integration Setup Guide

## Overview

ClearNowX uses RevenueCat to manage in-app subscriptions across iOS and Android platforms. RevenueCat simplifies subscription management, analytics, and receipt validation.

## Setup Steps

### 1. Create RevenueCat Account

1. Visit [https://www.revenuecat.com](https://www.revenuecat.com)
2. Sign up for a free account
3. Create a new project named "ClearNowX"

### 2. Configure App Store Connect Integration

#### In App Store Connect:
1. Go to **Users and Access** → **Keys**
2. Generate an **App Store Server API Key** (select Admin access)
3. Download the `.p8` key file and save the **Issuer ID** and **Key ID**

#### In RevenueCat Dashboard:
1. Navigate to **Project Settings** → **App Store**
2. Paste your App Store Server API Key (contents of `.p8` file)
3. Enter your **Issuer ID** and **Key ID**
4. Add your **Bundle ID**: `com.clearnowx.app`

### 3. Configure Products in RevenueCat

Create the following entitlements and products in RevenueCat:

#### Entitlements
- **ID**: `premium_access`
- **Display Name**: Premium Access
- **Description**: Unlock advanced features in ClearNowX

#### Products

**1. Monthly Subscription**
- **Product ID**: `clearnowx_monthly`
- **Type**: Renewable Subscription
- **Entitlement**: premium_access
- **Pricing**: $9.99/month
- **Trial**: 7-day free trial (configure in App Store Connect)
- **Intro Offer**: Optional - 50% off first month

**2. Annual Subscription**
- **Product ID**: `clearnowx_annual`
- **Type**: Renewable Subscription
- **Entitlement**: premium_access
- **Pricing**: $29.99/year
- **Trial**: 7-day free trial (configure in App Store Connect)

**3. Weekly Subscription**
- **Product ID**: `clearnowx_weekly`
- **Type**: Renewable Subscription
- **Entitlement**: premium_access
- **Pricing**: $4.99/week

### 4. Configure App Store Connect Subscription Groups

1. In **App Store Connect**, go to **In-App Purchases**
2. Create a new **Subscription Group**: `clearnowx_group`
3. Add all three products to this group (they handle cross-grade logic)
4. Set up 7-day free trial for monthly and annual subscriptions

### 5. Get Your RevenueCat API Key

1. In RevenueCat Dashboard, go to **Project Settings** → **API Keys**
2. Copy your **Public API Key** (starts with `appl_`)
3. This will be stored as `REVENUECAT_API_KEY` secret

### 6. Store API Key in Environment

The RevenueCat API key needs to be stored as a secret:

```bash
# Contact Replit support or use the Secrets panel
# Add the following secret:
# REVENUECAT_API_KEY = [your-api-key-from-step-5]
```

### 7. Install RevenueCat SDK

RevenueCat SDK should already be installed. If not:

```bash
npx expo install purchases-react-native
```

### 8. Configure Offerings in RevenueCat

In RevenueCat Dashboard → **Offerings**:

1. Create an **Offering** named "Default"
2. Add the three products created in step 3:
   - Monthly (primary)
   - Annual
   - Weekly

This offering will be fetched by your app to display subscription options.

### 9. Implementation in App

The app is already set up to use RevenueCat. The `PaywallScreen.tsx` component:

- Fetches offerings from RevenueCat
- Displays subscription options
- Handles purchases through RevenueCat
- Manages premium access state through the `premium_access` entitlement

Key environment variable needed:
```
REVENUECAT_API_KEY = [your-api-key]
```

### 10. Testing & Sandbox

#### TestFlight Testing:
1. Add testers to your app on App Store Connect
2. Testers can use TestFlight to test subscriptions
3. All TestFlight subscriptions are FREE (no actual charges)

#### Sandbox Testing:
1. Use a sandbox Apple ID in Settings → App Store
2. Sandbox subscriptions renew every 5 minutes for testing
3. Never use real credentials in sandbox

### 11. Monitoring & Analytics

In RevenueCat Dashboard, monitor:
- **Subscription Events**: Renewals, cancellations, conversions
- **Revenue**: Track MRR (Monthly Recurring Revenue)
- **Conversion Rates**: See how many users upgrade
- **Churn Analysis**: Understand cancellation patterns

## Security Notes

- **API Key**: Stored as `REVENUECAT_API_KEY` secret (never hardcoded)
- **No Client-Side Validation**: RevenueCat handles all receipt validation server-side
- **Secure Entitlement Checks**: Use RevenueCat's entitlement APIs for premium features
- **Never Log Keys**: The app does not log API keys or sensitive data

## Troubleshooting

### Products Not Showing
- Verify Bundle ID is correct in RevenueCat
- Ensure products are added to the Offering
- Check that App Store Server Key is valid

### Subscription Not Activating
- Verify TestFlight build includes RevenueCat SDK
- Check that entitlement ID is `premium_access`
- Ensure sandbox user is properly configured

### Network Issues
- Use Replit's built-in error handling
- Check internet connectivity before fetching offerings
- Implement retry logic with exponential backoff

## Migration Notes

If migrating from another payment provider:
1. Use RevenueCat's **App User ID** mapping
2. Transfer existing user data through RevenueCat API
3. Handle grace period for existing subscribers

## Support

- RevenueCat Documentation: [https://docs.revenuecat.com](https://docs.revenuecat.com)
- RevenueCat Support: support@revenuecat.com
- Dashboard: [https://dashboard.revenuecat.com](https://dashboard.revenuecat.com)

---

## Next Steps

1. ✅ Create RevenueCat account and set up integration
2. ✅ Configure products and offerings
3. ✅ Add API key to environment secrets
4. ✅ Test in TestFlight with sandbox user
5. ✅ Monitor analytics in RevenueCat Dashboard
