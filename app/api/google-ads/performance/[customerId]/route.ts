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

        // Get performance data for the customer
        const performance = await googleAdsService.getAccountPerformance(customerId);

        return NextResponse.json({
            success: true,
            customerId: customerId,
            performance: performance,
        });

    } catch (error: any) {
        console.error('Error fetching performance data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch performance data', details: error.message },
            { status: 500 }
        );
    }
}