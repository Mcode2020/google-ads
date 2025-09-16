'use client';
import { supabase } from '@/lib/supabaseClient';
import { simulateApi } from '@/utils/simulateApi';
import { useState } from 'react';
import { toast } from "react-hot-toast";
import { Pencil } from "lucide-react";
import CampaignForm from '../CampaignForm';

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

  const [publishToGoogleAds, setPublishToGoogleAds] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [googleAdsAccounts, setGoogleAdsAccounts] = useState<any[]>([]);

  // Fetch Google Ads accounts when modal opens
  useState(() => {
    const fetchGoogleAdsAccounts = async () => {
      try {
        const response = await fetch('/api/google-ads/accounts');
        const data = await response.json();
        if (data.success && data.accounts) {
          setGoogleAdsAccounts(data.accounts);
          if (data.accounts.length > 0) {
            setSelectedCustomerId(data.accounts[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Google Ads accounts:', error);
      }
    };
    
    fetchGoogleAdsAccounts();
  });

  async function handlePublish() {
    if (!currentRow.name?.trim()) return toast.error('Name is required');
    if (Number(currentRow.daily_budget) <= 5)
      return toast.error('Budget must be greater than 5');
    if (!currentRow.keywords || currentRow.keywords.length < 1)
      return toast.error('At least one keyword required');
    
    if (publishToGoogleAds && !selectedCustomerId) {
      return toast.error('Please select a Google Ads account');
    }

    try {
      setLoading(true);

      // First, update the campaign status in Supabase
      await simulateApi(async () => {
        const { error } = await supabase
          .from('campaigns')
          .update({
            status: 'published',
            last_synced: new Date().toISOString(),
          })
          .eq('id', currentRow.id);
        if (error) throw error;
      });

      // If user wants to publish to Google Ads, create the campaign there too
      if (publishToGoogleAds && selectedCustomerId) {
        toast.loading('Creating campaign in Google Ads...');
        
        console.log('Publishing to Google Ads:', {
          campaignId: currentRow.id,
          customerId: selectedCustomerId,
          campaignName: currentRow.name,
          campaignStatus: currentRow.status
        });
        
        const requestBody = {
          campaignId: currentRow.id,
          customerId: selectedCustomerId,
        };
        
        console.log('Request body:', requestBody);
        
        const googleAdsResponse = await fetch('/api/google-ads/create-campaign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const googleAdsResult = await googleAdsResponse.json();
        
        console.log('Google Ads API response:', googleAdsResult);
        
        if (googleAdsResult.success) {
          toast.dismiss();
          toast.success(`Campaign published to Google Ads! Campaign ID: ${googleAdsResult.campaignId}`);
          
          // Update current row with Google Ads info
          setCurrentRow((prev: any) => ({
            ...prev,
            google_ads_campaign_id: googleAdsResult.campaignId,
            google_ads_link: googleAdsResult.googleAdsLink,
          }));
        } else {
          toast.dismiss();
          toast.error(`Google Ads creation failed: ${googleAdsResult.message}`);
        }
      } else {
        toast.success('Campaign published successfully');
      }

      onPublish();
      onClose();
    } catch (err: any) {
      toast.error('Publish failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded shadow max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {!isEditing ? (
          <>
            <div className="flex align-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview Campaign</h3>
              <button
                className="text-sm py-2 px-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={16} className="inline mr-1" /> Edit
              </button>
            </div>

            <p className="py-2 border-b border-gray-200">
              <strong className="w-[50%] inline-block font-medium">Name:</strong>{' '}
              {currentRow.name}
            </p>
            <p className="py-2 border-b border-gray-200">
              <strong className="w-[50%] inline-block font-medium">Budget:</strong>{' '}
              ${currentRow.daily_budget}
            </p>
            <p className="py-2 border-b border-gray-200">
              <strong className="w-[50%] inline-block font-medium">
                Locations:
              </strong>{' '}
              {currentRow?.target_locations?.length
                ? currentRow.target_locations.join(', ')
                : 'None'}
            </p>
            <p className="py-2">
              <strong className="w-[50%] inline-block font-medium">
                Keywords:
              </strong>{' '}
              {currentRow?.keywords?.length ? currentRow.keywords.join(', ') : 'None'}
            </p>

            {/* Google Ads Info */}
            {currentRow.google_ads_link && (
              <p className="py-2 border-t border-gray-200 pt-3">
                <strong className="w-[50%] inline-block font-medium">
                  Google Ads:
                </strong>{' '}
                <a 
                  href={currentRow.google_ads_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View in Google Ads ↗
                </a>
              </p>
            )}

            {/* Google Ads Publishing Options */}
            {currentRow.status !== 'published' && googleAdsAccounts.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="publishToGoogleAds"
                    checked={publishToGoogleAds}
                    onChange={(e) => setPublishToGoogleAds(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="publishToGoogleAds" className="text-sm font-medium">
                    Also create campaign in Google Ads
                  </label>
                </div>
                
                {publishToGoogleAds && (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full mt-2 p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Select Google Ads Account</option>
                    {googleAdsAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.descriptive_name} ({account.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded cursor-pointer"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${
                  currentRow.status === 'published'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={handlePublish}
                disabled={currentRow.status === 'published' || loading}
              >
                {loading
                  ? 'Publishing…'
                  : currentRow.status === 'published'
                  ? 'Already Published'
                  : publishToGoogleAds
                  ? 'Publish to Google Ads'
                  : 'Publish'}
              </button>
            </div>
          </>
        ) : (
          <CampaignForm
            initialData={currentRow}
            
            onCreated={(updatedData) => {
              setCurrentRow(updatedData); // <-- update preview
              setIsEditing(false);
              onUpdateRow(updatedData);
            }}
            onCancel={() => setIsEditing(false)}
          />
        )}
      </div>
    </div>
  );
}
