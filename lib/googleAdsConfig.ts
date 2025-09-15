import { GoogleAdsApi, GoogleAdsApiOptions } from 'google-ads-api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface GoogleAdsCredentials {
    client_id: string;
    client_secret: string;
    developer_token: string;
    refresh_token: string;
}

/**
 * Creates a Google Ads API client instance using credentials from environment and session
 */
export async function createGoogleAdsClient(): Promise<GoogleAdsApi | null> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            console.error('No access token found in session');
            return null;
        }

        // Validate required environment variables
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
            console.error('Missing required environment variables for Google Ads API');
            return null;
        }

        const options: GoogleAdsApiOptions = {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        };

        console.log('Creating Google Ads client with options:', {
            client_id: options.client_id?.substring(0, 10) + '...',
            developer_token: options.developer_token?.substring(0, 10) + '...',
            has_client_secret: !!options.client_secret,
        });

        const client = new GoogleAdsApi(options);

        return client;
    } catch (error) {
        console.error('Error creating Google Ads client:', error);
        return null;
    }
}

/**
 * Gets Google Ads customer accounts for the authenticated user
 */
export async function getCustomerAccounts(client: GoogleAdsApi, refreshToken: string): Promise<any[]> {
    try {
        // Use the Manager Account to list accessible customers
        const customer = client.Customer({
            customer_id: '',
            refresh_token: refreshToken,
        });

        // Simple validation - try to query the customer info
        const customerInfo = await customer.query(`
      SELECT customer.id, customer.descriptive_name 
      FROM customer 
      LIMIT 1
    `);
        return customerInfo || [];
    } catch (error) {
        console.error('Error fetching customer accounts:', error);
        return [];
    }
}

/**
 * Validates if the current session has Google Ads API access
 */
export async function validateGoogleAdsAccess(): Promise<boolean> {
    try {
        const client = await createGoogleAdsClient();
        if (!client) return false;

        const session = await getServerSession(authOptions);
        if (!session?.accessToken) return false;

        // Try to make a simple API call to validate access
        const accounts = await getCustomerAccounts(client, session.accessToken);
        return accounts.length > 0;
    } catch (error) {
        console.error('Google Ads access validation failed:', error);
        return false;
    }
}