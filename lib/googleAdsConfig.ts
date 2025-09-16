import { GoogleAdsApi } from 'google-ads-api';
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
    const session = await getServerSession(authOptions);

    const refreshToken = session?.refreshToken;
    if (!refreshToken) {
        console.error("No refresh token found in session");
        return null;
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
        console.error("Missing required environment variables for Google Ads API");
        return null;
    }

    return new GoogleAdsApi({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });
}

/**
 * Lists all accessible Google Ads customer accounts for the authenticated user
 */
export async function listAccessibleCustomers(): Promise<string[]> {
    const client = await createGoogleAdsClient();
    if (!client) throw new Error("Google Ads client not initialized");

    const session = await getServerSession(authOptions);
    const refreshToken = session?.refreshToken;
    if (!refreshToken) throw new Error("No refresh token found in session");

    try {
        const response = await client.listAccessibleCustomers(refreshToken); // ✅ pass refreshToken
        // response.resource_names contains strings like "customers/1234567890"
        return response.resource_names || [];
    } catch (error: any) {
        console.error('Error listing accessible customers:', error);
        throw new Error(error.message || 'Failed to list customers');
    }
}


/**
 * Gets detailed customer info for a specific customer ID
 */
export async function getCustomerDetails(customerResourceName: string) {
    const client = await createGoogleAdsClient();
    if (!client) throw new Error("Google Ads client not initialized");

    const customerId = customerResourceName.split('/')[1]; // extract ID

    const customer = client.Customer({
        customer_id: customerId,
        refresh_token: (await getServerSession(authOptions))?.refreshToken!,
    });

    const query = `
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone,
      customer.manager
    FROM customer
    LIMIT 1
  `;

    const result = await customer.query(query);
    return result[0]?.customer;
}

/**
 * Validates if the current session has Google Ads API access
 */
export async function validateGoogleAdsAccess(): Promise<boolean> {
    try {
        const client = await createGoogleAdsClient();
        if (!client) return false;

        const customers = await listAccessibleCustomers();
        return customers.length > 0;
    } catch (error) {
        console.error('Google Ads access validation failed:', error);
        return false;
    }
}
