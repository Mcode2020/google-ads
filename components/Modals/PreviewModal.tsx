'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { toast } from "react-hot-toast";
import { Pencil } from "lucide-react";
import CampaignForm from '../CampaignForm';

interface GoogleAdsAccount {
  id: string;
  descriptive_name: string;
  currency_code: string;
  time_zone: string;
  manager: boolean;
}

export default function PreviewModal({
  row,
  onClose,
  onPublish,
  onUpdateRow,
}: {
  row: any;
  onClose: () => void;
  onPublish: () => void;
  onUpdateRow: (updatedData: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentRow, setCurrentRow] = useState(row);
  const [googleAdsAccounts, setGoogleAdsAccounts] = useState<GoogleAdsAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [googleAdsConnected, setGoogleAdsConnected] = useState(false);

  // Fetch Google Ads accounts when modal opens
  useEffect(() => {
    const fetchGoogleAdsAccounts = async () => {
      try {
        const response = await fetch('/api/google-ads/status');
        const data = await response.json();
        
        if (data.success && data.connected && data.accounts) {
          setGoogleAdsAccounts(data.accounts);
          setGoogleAdsConnected(true);
          if (data.accounts.length > 0) {
            setSelectedAccount(data.accounts[0].id); // Default to first account
          }
        } else {
          setGoogleAdsConnected(false);
          setGoogleAdsAccounts([]);
        }
      } catch (error) {
        console.error('Failed to fetch Google Ads accounts:', error);
        setGoogleAdsConnected(false);
        setGoogleAdsAccounts([]);
      }
    };
    
    fetchGoogleAdsAccounts();
  }, []);

  const handlePublish = async () => {
    setLoading(true);

    try {
      // Update campaign status to published in database
      const { data: updatedData, error: dbError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentRow.id)
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Campaign status updated to published in database');

      // If Google Ads is connected and an account is selected, publish to Google Ads
      if (googleAdsConnected && selectedAccount && googleAdsAccounts.length > 0) {
        const selectedAccountData = googleAdsAccounts.find(acc => acc.id === selectedAccount);
        
        console.log('Publishing to Google Ads:', {
          campaignId: currentRow.id,
          customerId: selectedAccount,
          campaignName: currentRow.name,
          accountName: selectedAccountData?.descriptive_name
        });
        
        try {
          const googleAdsResponse = await fetch('/api/google-ads/create-campaign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              campaignId: currentRow.id,
              customerId: selectedAccount,
            }),
          });

          const googleAdsResult = await googleAdsResponse.json();
          
          console.log('Google Ads API response:', googleAdsResult);
          
          if (googleAdsResult.success) {
            toast.success(`Campaign published to Google Ads! Account: ${selectedAccountData?.descriptive_name}`);
            
            // Update campaign with Google Ads info
            const { error: googleAdsUpdateError } = await supabase
              .from('campaigns')
              .update({
                google_ads_campaign_id: googleAdsResult.campaignId,
                google_ads_customer_id: selectedAccount,
                google_ads_account_name: selectedAccountData?.descriptive_name,
                last_synced: new Date().toISOString(),
              })
              .eq('id', currentRow.id);

            if (googleAdsUpdateError) {
              console.error('Failed to update Google Ads info in database:', googleAdsUpdateError);
            }

            // Update local state
            setCurrentRow((prev: any) => ({
              ...prev,
              status: 'published',
              google_ads_campaign_id: googleAdsResult.campaignId,
              google_ads_customer_id: selectedAccount,
              google_ads_account_name: selectedAccountData?.descriptive_name,
              last_synced: new Date().toISOString(),
            }));
          } else {
            toast.error(`Google Ads creation failed: ${googleAdsResult.message}`);
            toast.success('Campaign published locally (Google Ads publishing failed)');
          }
        } catch (googleAdsError) {
          console.error('Google Ads publishing failed:', googleAdsError);
          toast.error('Google Ads publishing failed, but campaign was published locally');
        }
      } else {
        toast.success('Campaign published locally');
      }

      // Update parent component
      onUpdateRow({
        ...updatedData,
        google_ads_customer_id: selectedAccount,
        google_ads_account_name: googleAdsAccounts.find(acc => acc.id === selectedAccount)?.descriptive_name,
      });
      
      onPublish();

    } catch (error: any) {
      console.error('Error publishing campaign:', error);
      toast.error(`Failed to publish campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedData: any) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updatedData)
        .eq('id', currentRow.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCurrentRow(data);
      onUpdateRow(data);
      setIsEditing(false);
      toast.success('Campaign updated successfully');
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      toast.error(`Failed to update campaign: ${error.message}`);
    }
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0  flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Edit Campaign</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <CampaignForm
              initialData={currentRow}
              onCreated={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Campaign Preview</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-sm rounded-full ${
                  currentRow.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentRow.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Campaign Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{currentRow.name}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Budget:</span>
                  <p>${currentRow.daily_budget}</p>
                </div>
                
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Targeting</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <p>{currentRow.target_locations}</p>
                </div>
               
                
                <div>
                  <span className="text-sm text-gray-600">Keywords:</span>
                  <p>{currentRow.keywords}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Ads Account Selection */}
          {googleAdsConnected && googleAdsAccounts.length > 0 && currentRow.status !== 'published' && (
            <div className="border-t pt-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Publish to Google Ads</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Google Ads Account:
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {googleAdsAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.descriptive_name} (ID: {account.id}) - {account.currency_code}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedAccount && (
                  <div className="text-sm text-gray-600">
                    Selected account: <strong>{googleAdsAccounts.find(acc => acc.id === selectedAccount)?.descriptive_name}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Google Ads Status */}
          {currentRow.google_ads_campaign_id && (
            <div className="border-t pt-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Google Ads Status</h3>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="text-sm">
                  <p><strong>Campaign ID:</strong> {currentRow.google_ads_campaign_id}</p>
                  <p><strong>Account:</strong> {currentRow.google_ads_account_name}</p>
                  <p><strong>Customer ID:</strong> {currentRow.google_ads_customer_id}</p>
                  {currentRow.last_synced && (
                    <p><strong>Last Synced:</strong> {new Date(currentRow.last_synced).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
            {currentRow.status !== 'published' && (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing...' : 
                 googleAdsConnected && selectedAccount ? 'Publish to Google Ads' : 'Publish Locally'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}