'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { simulateApi } from '@/utils/simulateApi';
import Select from 'react-select';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Draft = {
  id: string;
  name: string;
  daily_budget: string;
  target_locations: string[];
};

const availableLocations = [
  'United States',
  'India',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
];

export default function CampaignForm({
  onCreated,
  onCancel,
  initialData,
}: {
onCreated: (updatedData: any) => void;
  onCancel: () => void;
  initialData?: any;
}) {
  const [draft, setDraft] = useState<Draft>({
    id: '',
    name: '',
    daily_budget: '10',
    target_locations: [],
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordsList, setKeywordsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill when editing
  useEffect(() => {
    if (initialData) {
      setDraft({
        id: initialData.id,
        name: initialData.name || '',
        daily_budget: String(initialData.daily_budget || '10'),
        target_locations: initialData.target_locations || [],
      });
      setKeywordsList(initialData.keywords || []);
    }
  }, [initialData]);

  async function handleSaveDraft() {
    setError(null);
    setLoading(true);
    try {
      const keywords = keywordsList;

      await simulateApi(async () => {
        if (initialData) {
          // Update existing campaign
          const { error } = await supabase
            .from('campaigns')
            .update({
              name: draft.name,
              daily_budget: Number(draft.daily_budget),
              target_locations: draft.target_locations,
              keywords,
              last_synced: new Date().toISOString(),
            })
            .eq('id', initialData.id);
          if (error) throw error;
          toast.success('Campaign updated successfully');
        } else {
          // Insert new campaign
          const { error } = await supabase.from('campaigns').insert({
            name: draft.name,
            daily_budget: Number(draft.daily_budget),
            target_locations: draft.target_locations,
            keywords,
            status: 'draft',
            last_synced: null,
            google_ads_link: `https://ads.google.com/aw/campaigns?campaignId=${Math.random()
              .toString(36)
              .slice(2)}`,
          });
          if (error) throw error;
          toast.success('Campaign saved to draft successfully');
        }
      }, 700 + Math.random() * 500, 0.1);

      // Reset if creating new
      if (!initialData) {
        setDraft({ id: '', name: '', daily_budget: '10', target_locations: [] });
        setKeywordInput('');
        setKeywordsList([]);
      }

      const updatedData = {
        ...draft,
        keywords: keywordsList,
        status: initialData?.status || 'draft',
      };

  onCreated(updatedData);    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const locationOptions = availableLocations.map((loc) => ({
    value: loc,
    label: loc,
  }));

  // Handle keywords
  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywordsList.includes(trimmed)) {
      setKeywordsList([...keywordsList, trimmed]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywordsList(keywordsList.filter((k) => k !== kw));
  };

  return (
    <div className="relative">
      <h2 className="text-lg font-semibold mb-4">
        {initialData ? 'Edit Campaign' : 'Create Campaign'}
      </h2>

      {/* Close Icon */}
      <button
        className="absolute top-2 right-2 text-gray-600 hover:text-black"
        onClick={onCancel}
      >
        <X size={20} />
      </button>

      {/* Campaign Name */}
      <label className="block mb-2">Campaign name *</label>
      <input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        className="w-full p-2 border border-gray-200 rounded mb-3"
        placeholder="Enter Campaign Name"
      />

      {/* Daily Budget */}
      <label className="block mb-2">Daily budget (USD) *</label>
      <input
        type="text"
        value={draft.daily_budget}
        onChange={(e) => setDraft({ ...draft, daily_budget: e.target.value })}
        className="w-full p-2 border border-gray-200 rounded mb-3"
      />

      {/* Target Locations */}
      <label className="block mb-2">Target locations *</label>
      <Select
        isMulti
        options={locationOptions}
        value={locationOptions.filter((opt) =>
          draft.target_locations.includes(opt.value)
        )}
        onChange={(selected) =>
          setDraft({
            ...draft,
            target_locations: selected.map((opt) => opt.value),
          })
        }
        className="mb-3 rounded"
      />

      {/* Keywords */}
      <label className="block mb-2">Keywords *</label>
      <div className="mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addKeyword())
            }
            placeholder="Type keyword and press Enter"
            className="w-full p-2 border border-gray-200 rounded"
          />
          <button
            type="button"
            className="px-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={addKeyword}
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {keywordsList.map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full text-sm"
            >
              {kw}
              <X
                size={14}
                className="cursor-pointer text-gray-600 hover:text-gray-800"
                onClick={() => removeKeyword(kw)}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* Actions */}
      <div className="flex gap-2 mt-5">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleSaveDraft}
          disabled={loading}
        >
          {loading
            ? 'Saving…'
            : initialData
            ? 'Update Campaign'
            : 'Save Draft'}
        </button>
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
