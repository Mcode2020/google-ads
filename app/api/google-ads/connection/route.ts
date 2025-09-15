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

        // First check if we already have a connection status
        const existingStatus = await getGoogleAdsConnectionStatus(session.user.email);

        if (existingStatus && existingStatus.connected && existingStatus.lastChecked) {
            const lastChecked = new Date(existingStatus.lastChecked);
            const now = new Date();
            const hoursSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);

            // If checked within last 24 hours and was connected, return cached status
            if (hoursSinceLastCheck < 24) {
                return NextResponse.json({
                    success: true,
                    message: 'Google Ads connection verified (cached)',
                    connected: true,
                    lastChecked: existingStatus.lastChecked,
                });
            }
        }

        // Only test connection if not recently checked or if previously failed
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

        const connectionTest = await googleAdsService.testConnection();

        // Update the connection status in database
        await updateGoogleAdsConnectionStatus(session.user.email, connectionTest.success);

        if (connectionTest.success) {
            return NextResponse.json({
                success: true,
                message: connectionTest.message,
                connected: true,
                accounts: connectionTest.accounts || [],
            });
        } else {
            return NextResponse.json({
                success: false,
                message: connectionTest.message,
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