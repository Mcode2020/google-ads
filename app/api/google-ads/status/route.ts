import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    getGoogleAdsConnectionStatus,
    updateGoogleAdsConnectionStatus
} from '@/lib/userService';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const status = await getGoogleAdsConnectionStatus(session.user.email);

        if (status === null) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            connected: status.connected,
            lastChecked: status.lastChecked,
        });
    } catch (error: any) {
        console.error('Error getting connection status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
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

        if (action === 'disconnect') {
            // Set connection status to false
            const success = await updateGoogleAdsConnectionStatus(
                session.user.email,
                false
            );

            if (success) {
                return NextResponse.json({
                    success: true,
                    message: 'Google Ads disconnected successfully',
                    connected: false,
                });
            } else {
                return NextResponse.json(
                    { error: 'Failed to update connection status' },
                    { status: 500 }
                );
            }
        } else if (action === 'connect') {
            // Test the connection and update status
            const { GoogleAdsService } = await import('@/lib/googleAdsService');

            try {
                const googleAdsService = new GoogleAdsService();
                const initialized = await googleAdsService.initialize();

                if (!initialized) {
                    await updateGoogleAdsConnectionStatus(session.user.email, false);
                    return NextResponse.json({
                        success: false,
                        message: 'Failed to initialize Google Ads client',
                        connected: false,
                    });
                }

                const connectionTest = await googleAdsService.testConnection();
                await updateGoogleAdsConnectionStatus(session.user.email, connectionTest.success);

                return NextResponse.json({
                    success: connectionTest.success,
                    message: connectionTest.message,
                    connected: connectionTest.success,
                });
            } catch (error: any) {
                await updateGoogleAdsConnectionStatus(session.user.email, false);
                return NextResponse.json({
                    success: false,
                    message: `Connection failed: ${error.message}`,
                    connected: false,
                });
            }
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "connect" or "disconnect"' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Error managing connection:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}