import { NextRequest, NextResponse } from 'next/server';
import { GoogleAdsService } from '@/lib/googleAdsService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { campaignId, customerId } = await request.json();

        // Get the user from the users table using the email from NextAuth session
        const { data: userData, error: userFetchError } = await supabaseAdmin
            .from('users')
            .select('id, email, name')
            .eq('email', session.user.email)
            .single();
        console.log(userData)
        if (userFetchError || !userData) {
            console.error('Failed to find user in database:', userFetchError);
            return NextResponse.json(
                { error: 'User not found in database' },
                { status: 404 }
            );
        }

        console.log('Received request to create Google Ads campaign:', {
            campaignId,
            customerId,
            userEmail: session.user.email,
            userId: userData.id
        });

        if (!campaignId || !customerId) {
            return NextResponse.json(
                { error: 'Campaign ID and Customer ID are required' },
                { status: 400 }
            );
        }

        // Get campaign data from Supabase
        console.log('Searching for campaign with ID:', campaignId);

        // First, let's check what campaigns exist for this user
        const { data: allCampaigns, error: listError } = await supabaseAdmin
            .from('campaigns')
            .select('id, name, status, user_id')
            .eq('user_id', userData.id)
            .limit(10);

        console.log('Available campaigns for user:', allCampaigns);

        // Now try to get the specific campaign for this user
        const { data: campaignResults, error: fetchError } = await supabaseAdmin
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .eq('user_id', userData.id);

        console.log('Campaign query results:', {
            campaignId,
            resultsCount: campaignResults?.length || 0,
            results: campaignResults,
            error: fetchError?.message
        });

        if (fetchError) {
            console.error('Supabase fetch error:', fetchError);
            return NextResponse.json(
                { error: `Database error: ${fetchError.message}` },
                { status: 500 }
            );
        }

        if (!campaignResults || campaignResults.length === 0) {
            return NextResponse.json(
                {
                    error: `Campaign with ID "${campaignId}" not found in database`,
                    availableCampaigns: allCampaigns?.map((c: any) => ({ id: c.id, name: c.name })) || []
                },
                { status: 404 }
            );
        }

        if (campaignResults.length > 1) {
            console.warn('Multiple campaigns found with same ID:', campaignResults);
        }

        const campaignData = campaignResults[0];

        // Initialize Google Ads service
        const googleAdsService = new GoogleAdsService();
        const initialized = await googleAdsService.initialize();

        if (!initialized) {
            return NextResponse.json(
                { error: 'Failed to initialize Google Ads client' },
                { status: 500 }
            );
        }

        // Create campaign in Google Ads
        const result = await googleAdsService.createCampaign(customerId, {
            name: campaignData.name,
            dailyBudget: campaignData.daily_budget,
            keywords: campaignData.keywords || [],
            targetLocations: campaignData.target_locations || [],
        });

        if (result) {
            // Update the campaign in Supabase with Google Ads info
            // const { error: updateError } = await supabaseAdmin
            //     .from('campaigns')
            //     .update({
            //         google_ads_campaign_id: result.campaignId,
            //         google_ads_customer_id: customerId,
            //         google_ads_link: `https://ads.google.com/aw/campaigns?campaignId=${result.campaignId}`,
            //         status: 'published',
            //         last_synced: new Date().toISOString(),
            //     })
            //     .eq('id', campaignId)
            //     .eq('user_id', userData.id);

            // if (updateError) {
            //     console.error('Failed to update campaign with Google Ads info:', updateError);
            //     // Still return success since the Google Ads campaign was created
            // }

            return NextResponse.json({
                success: true,
                message: result.message,
                campaignId: result.campaignId,
                googleAdsLink: `https://ads.google.com/aw/campaigns?campaignId=${result.campaignId}`,
            });
        } else {
            return NextResponse.json({
                success: false,
                message: result.message,
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Error creating Google Ads campaign:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}