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
}: {
  row: any;
  onClose: () => void;
  onPublish: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
    const [currentRow, setCurrentRow] = useState(row);

  async function handlePublish() {
    if (!currentRow.name?.trim()) return toast.error('Name is required');
    if (Number(currentRow.daily_budget) <= 5)
      return toast.error('Budget must be greater than 5');
    if (!currentRow.keywords || currentRow.keywords.length < 1)
      return toast.error('At least one keyword required');
    try {
      setLoading(true);
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
      onPublish();
      toast.success('Campaign published successfully');
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
            }}
            onCancel={() => setIsEditing(false)}
          />
        )}
      </div>
    </div>
  );
}
