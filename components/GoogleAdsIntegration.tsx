'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface GoogleAdsAccount {
  id: string;
  descriptive_name: string;
  currency_code: string;
  time_zone: string;
  manager: boolean;
}

interface ConnectionStatus {
  connected: boolean;
  message: string;
  lastChecked?: string;
}

export default function GoogleAdsIntegration() {
  const { data: session, status } = useSession();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check connection status when user is authenticated
  useEffect(() => {
    if (session?.accessToken && status === 'authenticated') {
      checkConnectionStatus();
    }
  }, [session, status]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/google-ads/status');
      const data = await response.json();
      
      setConnectionStatus({
        connected: data.connected,
        message: data.message,
        lastChecked: data.lastChecked || new Date().toISOString(),
      });
      
      if (data.connected && data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus({
        connected: false,
        message: 'Failed to check connection status',
      });
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/google-ads/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'connect' }),
      });
      
      const data = await response.json();
      
      setConnectionStatus({
        connected: data.connected,
        message: data.message,
        lastChecked: new Date().toISOString(),
      });
      
      if (data.connected) {
        toast.success('Google Ads connected successfully!');
        setAccounts(data.accounts || []);
      } else {
        toast.error(`Connection failed: ${data.message}`);
      }
    } catch (error: any) {
      toast.error('Failed to connect to Google Ads');
      console.error('Connection error:', error);
      setConnectionStatus({
        connected: false,
        message: `Connection error: ${error.message}`,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/google-ads/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      
      const data = await response.json();
      
      setConnectionStatus({
        connected: false,
        message: 'Disconnected from Google Ads',
        lastChecked: new Date().toISOString(),
      });
      
      // Clear accounts
      setAccounts([]);
      
      toast.success('Disconnected from Google Ads');
    } catch (error: any) {
      toast.error('Failed to disconnect');
      console.error('Disconnect error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Google Ads Integration</h2>
          <p className="text-gray-600">Please sign in to connect your Google Ads account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Google Ads Integration</h2>
            <p className="text-sm text-gray-600">
              Connect your Google Ads account to publish campaigns directly.
            </p>
          </div>
          
          {/* Connect/Disconnect Button */}
          <div className="flex gap-2">
            {connectionStatus?.connected ? (
              <button
                onClick={handleDisconnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isConnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect to Google Ads'}
              </button>
            )}
          </div>
        </div>

        {connectionStatus && (
          <div className="space-y-2">
            <div className={`p-3 rounded-md ${
              connectionStatus.connected 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">
                  {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-sm mt-1">{connectionStatus.message}</p>
              {connectionStatus.lastChecked && (
                <p className="text-xs mt-1 opacity-75">
                  Last checked: {new Date(connectionStatus.lastChecked).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Google Ads Accounts */}
      {connectionStatus?.connected && accounts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Connected Google Ads Accounts ({accounts.length})
          </h3>
          
          <div className="grid gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{account.descriptive_name}</h4>
                    <p className="text-sm text-gray-600">
                      ID: {account.id} • Currency: {account.currency_code} • Timezone: {account.time_zone}
                    </p>
                    {account.manager && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Manager Account
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Accounts Message */}
      {connectionStatus?.connected && accounts.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center text-gray-600">
            <p>No Google Ads accounts found or accessible.</p>
            <p className="text-sm mt-1">
              Make sure you have Google Ads accounts set up and accessible with your Google account.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}