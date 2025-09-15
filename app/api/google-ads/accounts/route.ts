import { NextRequest, NextResponse } from 'next/server';
import { GoogleAdsService } from '@/lib/googleAdsService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
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

        // Get customer accounts
        const accounts = await googleAdsService.getCustomerAccounts();

        return NextResponse.json({
            success: true,
            accounts: accounts,
            count: accounts.length,
        });

    } catch (error: any) {
        console.error('Error fetching Google Ads accounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch accounts', details: error.message },
            { status: 500 }
        );
    }
}