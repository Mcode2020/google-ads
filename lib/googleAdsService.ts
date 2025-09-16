import { GoogleAdsApi } from 'google-ads-api';
import { createGoogleAdsClient } from './googleAdsConfig';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface CustomerAccount {
    id: string;
    descriptive_name: string;
    currency_code: string;
    time_zone: string;
    manager: boolean;
}

export class GoogleAdsService {
    private client: GoogleAdsApi | null = null;

    async initialize(): Promise<boolean> {
        try {
            this.client = await createGoogleAdsClient();
            if (this.client) {
                console.log('Google Ads client initialized successfully');
                return true;
            } else {
                console.error('Failed to initialize Google Ads client');
                return false;
            }
        } catch (error) {
            console.error('Error initializing Google Ads client:', error);
            return false;
        }
    }

    private async getRefreshToken(): Promise<string> {
        const session = await getServerSession(authOptions);
        const refreshToken = session?.refreshToken;

        if (!refreshToken) {
            throw new Error('No refresh token available in session');
        }

        return refreshToken;
    }

    isReady(): boolean {
        return this.client !== null;
    }

    async getCustomerAccounts(): Promise<CustomerAccount[]> {
        if (!this.client) throw new Error('Google Ads client not initialized');

        const refreshToken = await this.getRefreshToken();
        console.log('Fetching accessible customer accounts with refresh token:', refreshToken);

        try {
            const response = await this.client.listAccessibleCustomers(refreshToken);
            console.log('listAccessibleCustomers response:', response);

            if (!response?.resource_names?.length) return [];

            const accounts: CustomerAccount[] = [];

            for (const resourceName of response.resource_names) {
                const customerId = resourceName.split('/')[1];

                try {
                    const customer = this.client.Customer({
                        customer_id: customerId,
                        refresh_token: refreshToken,
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

                    const customerData = await customer.query(query);

                    const info = customerData?.[0]?.customer;

                    if (info?.id != null) {
                        accounts.push({
                            id: info.id.toString(),
                            descriptive_name: info.descriptive_name || `Account ${customerId}`,
                            currency_code: info.currency_code || 'USD',
                            time_zone: info.time_zone || 'UTC',
                            manager: info.manager ?? false,
                        });
                    } else {
                        // fallback if info is null/undefined
                        accounts.push({
                            id: customerId,
                            descriptive_name: `Google Ads Account ${customerId}`,
                            currency_code: 'USD',
                            time_zone: 'UTC',
                            manager: false,
                        });
                    }
                } catch (err) {
                    console.warn(`Failed to fetch details for ${customerId}, using fallback`, err);
                    accounts.push({
                        id: customerId,
                        descriptive_name: `Google Ads Account ${customerId}`,
                        currency_code: 'USD',
                        time_zone: 'UTC',
                        manager: false,
                    });
                }
            }

            return accounts;

        } catch (error: any) {
            console.error('Google Ads API error:', error);
            throw new Error(error.message || 'Failed to fetch customer accounts');
        }
    }


    async createCampaign(customerId: string, campaignData: any): Promise<any> {
        if (!this.client) throw new Error('Google Ads client not initialized');

        try {
            const refreshToken = await this.getRefreshToken();
            console.log('Creating campaign:', campaignData.name, 'for customer:', customerId);

            // Mock response for testing; replace with actual API call later
            const mockResponse = {
                results: [
                    {
                        resource_name: `customers/${customerId}/campaigns/mock_campaign_${Date.now()}`,
                        status: 'PAUSED',
                    },
                ],
                partial_failure_error: null,
                request_id: `mock_request_${Date.now()}`,
            };

            console.log('Mock campaign created:', mockResponse);
            return mockResponse;

        } catch (error: any) {
            console.error('Error creating campaign:', error);
            throw new Error(`Failed to create campaign: ${error.message}`);
        }
    }

}
