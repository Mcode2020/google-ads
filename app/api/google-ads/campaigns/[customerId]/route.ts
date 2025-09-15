import { NextRequest, NextResponse } from 'next/server';
import { GoogleAdsService } from '@/lib/googleAdsService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
    request: NextRequest,
    { params }: { params: { customerId: string } }
) {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const customerId = params.customerId;

        if (!customerId) {
            return NextResponse.json(
                { error: 'Customer ID is required' },
                { status: 400 }
            );
        }

        // Initialize Google Ads service
        const googleAdsService = new GoogleAdsService();
        const initialized = await googleAdsService.initialize();

        if (!initialized) {
            return NextResponse.json(
                { error: 'Failed to initialize Google Ads client' },
                { status: 500 }
            );
        }

        // Get campaigns for the customer
        const campaigns = await googleAdsService.getCampaigns(customerId);

        return NextResponse.json({
            success: true,
            customerId: customerId,
            campaigns: campaigns,
            count: campaigns.length,
        });

    } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaigns', details: error.message },
            { status: 500 }
        );
    }
}