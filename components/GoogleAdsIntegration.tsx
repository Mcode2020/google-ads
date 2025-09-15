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

interface Campaign {
  id: string;
  name: string;
  status: string;
  advertising_channel_type: string;
  start_date: string;
  end_date?: string;
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
  const [campaigns, setCampaigns] = useState<{ [customerId: string]: Campaign[] }>({});
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Check connection status when user is authenticated (only once)
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
        message: data.connected ? 'Connected to Google Ads' : 'Not connected to Google Ads',
        lastChecked: data.lastChecked,
      });
      
      if (data.connected) {
        await fetchAccounts();
      }
    } catch (error: any) {
      console.error('Error checking connection status:', error);
      setConnectionStatus({
        connected: false,
        message: 'Error checking connection status',
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
        await fetchAccounts();
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
      
      // Clear accounts and campaigns
      setAccounts([]);
      setCampaigns({});
      setSelectedAccount('');
      
      toast.success('Disconnected from Google Ads');
    } catch (error: any) {
      toast.error('Failed to disconnect');
      console.error('Disconnect error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-ads/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(data.accounts[0].id);
        }
      } else {
        toast.error('Failed to fetch Google Ads accounts');
      }
    } catch (error: any) {
      toast.error('Error fetching accounts');
      console.error('Accounts fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async (customerId: string) => {
    if (!customerId) return;
    
    try {
      const response = await fetch(`/api/google-ads/campaigns/${customerId}`);
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(prev => ({ ...prev, [customerId]: data.campaigns }));
        toast.success(`Fetched ${data.campaigns.length} campaigns`);
      } else {
        toast.error('Failed to fetch campaigns');
      }
    } catch (error: any) {
      toast.error('Error fetching campaigns');
      console.error('Campaigns fetch error:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse">Loading Google Ads integration...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please sign in to connect with Google Ads</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Google Ads Integration</h3>
          
          <div className="flex items-center space-x-2">
            {/* Connection Status Badge */}
            {connectionStatus && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus.connected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            )}
            
            {/* Connect/Disconnect Button */}
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
                {isConnecting ? 'Connecting...' : 'Connect'}
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
              <p>{connectionStatus.message}</p>
            </div>
            
            {connectionStatus.lastChecked && (
              <p className="text-sm text-gray-500">
                Last checked: {new Date(connectionStatus.lastChecked).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Google Ads Accounts */}
      {connectionStatus?.connected && accounts.length > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Google Ads Accounts</h4>
          
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAccount === account.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAccount(account.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">{account.descriptive_name}</h5>
                    <p className="text-sm text-gray-600">
                      ID: {account.id} | Currency: {account.currency_code} | 
                      Timezone: {account.time_zone}
                      {account.manager && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Manager</span>}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchCampaigns(account.id);
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Load Campaigns
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns */}
      {connectionStatus?.connected && selectedAccount && campaigns[selectedAccount] && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Campaigns for Account {selectedAccount}
          </h4>
          
          {campaigns[selectedAccount].length > 0 ? (
            <div className="space-y-2">
              {campaigns[selectedAccount].map((campaign) => (
                <div key={campaign.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-medium text-gray-900">{campaign.name}</h6>
                      <p className="text-sm text-gray-600">
                        ID: {campaign.id} | Type: {campaign.advertising_channel_type} | 
                        Status: <span className={`font-medium ${
                          campaign.status === 'ENABLED' ? 'text-green-600' : 
                          campaign.status === 'PAUSED' ? 'text-yellow-600' : 'text-red-600'
                        }`}>{campaign.status}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Start: {campaign.start_date}
                        {campaign.end_date && ` | End: ${campaign.end_date}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No campaigns found for this account.</p>
          )}
        </div>
      )}

      {loading && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="animate-pulse text-center">Loading...</div>
        </div>
      )}
    </div>
  );
}