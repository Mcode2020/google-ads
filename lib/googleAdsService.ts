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

            const accounts: CustomerAccount[] = [];

            const login_customer_id = process.env.LOGIN_CUSTOMER_ID!;
            try {
                const customer = this.client.Customer({
                    refresh_token: refreshToken,
                    customer_id: login_customer_id,
                });

                const query = `
           SELECT
                            customer_client.client_customer,
                            customer_client.level,
                            customer_client.manager,
                            customer_client.descriptive_name,
                            customer_client.currency_code,
                            customer_client.time_zone,
                            customer_client.id
                        FROM customer_client
          LIMIT 10
        `;

                const customerData = await customer.query(query);
                console.log("customer data", customerData)
                const info = customerData;
                for (const acc of info) {
                    const account: any = acc.customer_client;
                    if (account.manager) continue;
                    accounts.push({ id: account.id.toString(), descriptive_name: account.descriptive_name || `Account ${account.id}`, currency_code: account.currency_code || 'USD', time_zone: account.time_zone || 'UTC', manager: account.manager ?? false, });
                }
            } catch (err) {
                console.warn(`Failed to fetch details for ${login_customer_id}, using fallback`, err);
                accounts.push({
                    id: login_customer_id,
                    descriptive_name: `Google Ads Account ${login_customer_id}`,
                    currency_code: 'USD',
                    time_zone: 'UTC',
                    manager: false,
                });
            }


            return accounts;

        } catch (error: any) {
            console.error('Google Ads API error:', error);
            throw new Error(error.message || 'Failed to fetch customer accounts');
        }
    }


    async createCampaign(customer_id: string, campaignData: any): Promise<any> {
        if (!this.client) throw new Error("Google Ads client not initialized");

        try {
            const refreshToken = await this.getRefreshToken();
            const login_customer_id = process.env.LOGIN_CUSTOMER_ID!;
            const customer = this.client.Customer({
                customer_id,
                refresh_token: refreshToken,
                login_customer_id,
            });

            console.log("customer data", customer)
            console.log("camaign data", campaignData)

            const result = await customer.campaigns.create([
                {
                    name: campaignData.name,
                    advertising_channel_type: "SEARCH",
                    status: "PAUSED",
                    manual_cpc: {},
                    campaign_budget: `customers/${customer_id}/campaignBudgets/14942845366`,
                    network_settings: {
                        "target_google_search": true,
                        "target_search_network": true,
                        "target_content_network": true,
                        "target_partner_search_network": false
                    },
                    contains_eu_political_advertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING"
                },
            ]);


            console.log("Google Ads campaign created:", result);
            return result;
        } catch (error: any) {
            console.error("Error creating campaign:", error);
            throw new Error(`Failed to create campaign: ${error.message}`);
        }
    }
}

