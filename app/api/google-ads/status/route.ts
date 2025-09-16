import { NextRequest, NextResponse } from 'next/server';
import { GoogleAdsService } from '@/lib/googleAdsService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    getGoogleAdsConnectionStatus,
    updateGoogleAdsConnectionStatus
} from '@/lib/userService';

export async function GET() {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session?.accessToken || !session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Test the connection by trying to fetch accounts
        console.log('Testing Google Ads connection for user:', session.user.email);

        const googleAdsService = new GoogleAdsService();
        const initialized = await googleAdsService.initialize();

        if (!initialized) {
            await updateGoogleAdsConnectionStatus(session.user.email, false);
            return NextResponse.json(
                { error: 'Failed to initialize Google Ads client', connected: false },
                { status: 500 }
            );
        }

        try {
            // Try to fetch accounts to test connection
            const accounts = await googleAdsService.getCustomerAccounts();

            // Update the connection status in database
            await updateGoogleAdsConnectionStatus(session.user.email, true);

            return NextResponse.json({
                success: true,
                message: 'Successfully connected to Google Ads',
                connected: true,
                accounts: accounts || [],
                lastChecked: new Date().toISOString(),
            });
        } catch (error: any) {
            await updateGoogleAdsConnectionStatus(session.user.email, false);

            return NextResponse.json({
                success: false,
                message: `Connection failed: ${error.message}`,
                connected: false,
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Google Ads connection test error:', error);

        // Update status to failed if we have user email
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            await updateGoogleAdsConnectionStatus(session.user.email, false);
        }

        return NextResponse.json(
            { error: 'Internal server error', details: error.message, connected: false },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { action } = await request.json();

        if (action === 'connect') {
            // Test connection and update status
            const googleAdsService = new GoogleAdsService();
            const initialized = await googleAdsService.initialize();
            console.log(initialized, "initialized================")

            if (!initialized) {
                await updateGoogleAdsConnectionStatus(session.user.email, false);
                return NextResponse.json(
                    { error: 'Failed to initialize Google Ads client', connected: false },
                    { status: 500 }
                );
            }

            try {
                const accounts = await googleAdsService.getCustomerAccounts();
                console.log(accounts, "accounts================")
                console.log(session, "email================")
                await updateGoogleAdsConnectionStatus(session.user.email, true);


                return NextResponse.json({
                    success: true,
                    message: 'Successfully connected to Google Ads',
                    connected: true,
                    accounts: accounts || [],
                });
            } catch (error: any) {
                await updateGoogleAdsConnectionStatus(session.user.email, false);
                return NextResponse.json({
                    success: false,
                    message: `Connection failed: ${error.message}`,
                    connected: false,
                }, { status: 400 });
            }
        } else if (action === 'disconnect') {
            await updateGoogleAdsConnectionStatus(session.user.email, false);
            return NextResponse.json({
                success: true,
                message: 'Disconnected from Google Ads',
                connected: false,
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Google Ads status update error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}