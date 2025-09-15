# Google Ads SDK Integration

## Overview
This implementation provides seamless Google Ads API integration that automatically connects when users authenticate with their Gmail account. The system uses your developer token and OAuth credentials to fetch Google Ads data.

## Features Implemented

### 1. Google Ads SDK Integration ✅
- **Library**: Official `google-ads-api` Node.js client
- **Authentication**: Automatic OAuth token integration with NextAuth session
- **Configuration**: Uses environment variables for developer token and OAuth credentials

### 2. API Endpoints ✅
- `GET /api/google-ads/connection` - Test Google Ads API connection
- `GET /api/google-ads/accounts` - Fetch accessible Google Ads accounts
- `GET /api/google-ads/campaigns/[customerId]` - Get campaigns for specific account
- `GET /api/google-ads/performance/[customerId]` - Get performance metrics for account

### 3. Service Layer ✅
- **GoogleAdsService** class with methods for:
  - `getCustomerAccounts()` - Retrieve accessible accounts
  - `getCampaigns(customerId)` - Get campaigns for an account
  - `getAccountPerformance(customerId)` - Fetch performance metrics
  - `testConnection()` - Validate API access

### 4. OAuth Scopes ✅
- Added Google Ads API scope: `https://www.googleapis.com/auth/adwords`
- Maintains existing email and profile scopes
- Continues to request offline access for refresh tokens

### 5. UI Components ✅
- **GoogleAdsIntegration** component automatically fetches data after login
- Displays connection status and accessible accounts
- Shows campaigns for selected accounts
- Real-time feedback with toast notifications

## Environment Variables Required

```env
# Existing OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Ads Developer Token
GOOGLE_ADS_DEVELOPER_TOKEN=DOPgfmwpwnR-PiYF7SIMVA

# NextAuth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

## How It Works

1. **Authentication Flow**:
   - User signs in with Gmail account
   - OAuth includes Google Ads API scope
   - Access token is stored in NextAuth session

2. **Automatic Connection**:
   - When dashboard loads, GoogleAdsIntegration component automatically tests connection
   - Fetches accessible Google Ads accounts
   - Displays account information and allows campaign browsing

3. **API Integration**:
   - Server-side API routes handle Google Ads API calls
   - Authentication is validated via NextAuth session
   - Uses developer token + OAuth access token for API requests

## File Structure

```
lib/
├── googleAdsConfig.ts      # Configuration and client creation
└── googleAdsService.ts     # Service layer for Google Ads operations

app/api/google-ads/
├── connection/route.ts     # Test connection endpoint
├── accounts/route.ts       # Get accounts endpoint
├── campaigns/[customerId]/route.ts  # Get campaigns endpoint
└── performance/[customerId]/route.ts # Get performance endpoint

components/
└── GoogleAdsIntegration.tsx # UI component for Google Ads data
```

## Usage

After signing in with Gmail, the dashboard automatically:
1. Tests Google Ads API connection
2. Displays connection status
3. Shows accessible Google Ads accounts
4. Allows fetching campaigns for each account

The integration is seamless - no additional authentication steps required beyond the initial Gmail sign-in.

## Error Handling

- Connection failures are displayed with helpful error messages
- API errors are caught and presented to the user
- Fallback handling for accounts without Google Ads access
- Toast notifications provide real-time feedback

## Next Steps

You can extend this integration by:
- Adding more Google Ads API features (ad groups, keywords, etc.)
- Implementing campaign creation/editing functionality
- Adding performance charts and analytics
- Setting up automated reporting