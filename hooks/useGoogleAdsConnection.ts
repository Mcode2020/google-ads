'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface GoogleAdsConnectionStatus {
    connected: boolean;
    message: string;
    lastChecked?: string;
    loading: boolean;
}

export function useGoogleAdsConnection() {
    const { data: session, status } = useSession();
    const [connectionStatus, setConnectionStatus] = useState<GoogleAdsConnectionStatus>({
        connected: false,
        message: 'Checking connection...',
        loading: true,
    });

    const checkStatus = async () => {
        if (!session?.user?.email) return;

        try {
            const response = await fetch('/api/google-ads/status');
            const data = await response.json();

            setConnectionStatus({
                connected: data.connected,
                message: data.connected ? 'Connected to Google Ads' : 'Not connected to Google Ads',
                lastChecked: data.lastChecked,
                loading: false,
            });
        } catch (error) {
            setConnectionStatus({
                connected: false,
                message: 'Error checking connection status',
                loading: false,
            });
        }
    };

    const connect = async () => {
        setConnectionStatus(prev => ({ ...prev, loading: true }));

        try {
            const response = await fetch('/api/google-ads/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'connect' }),
            });

            const data = await response.json();

            setConnectionStatus({
                connected: data.connected,
                message: data.message,
                lastChecked: new Date().toISOString(),
                loading: false,
            });

            return { success: data.connected, message: data.message };
        } catch (error: any) {
            setConnectionStatus({
                connected: false,
                message: `Connection error: ${error.message}`,
                loading: false,
            });

            return { success: false, message: error.message };
        }
    };

    const disconnect = async () => {
        setConnectionStatus(prev => ({ ...prev, loading: true }));

        try {
            await fetch('/api/google-ads/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect' }),
            });

            setConnectionStatus({
                connected: false,
                message: 'Disconnected from Google Ads',
                lastChecked: new Date().toISOString(),
                loading: false,
            });

            return { success: true, message: 'Disconnected successfully' };
        } catch (error: any) {
            setConnectionStatus(prev => ({ ...prev, loading: false }));
            return { success: false, message: error.message };
        }
    };

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            checkStatus();
        }
    }, [session, status]);

    return {
        ...connectionStatus,
        connect,
        disconnect,
        refresh: checkStatus,
    };
}