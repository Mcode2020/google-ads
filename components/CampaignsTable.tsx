    'use client';
    import React, { useEffect, useState } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { simulateApi } from '@/utils/simulateApi';
    import CampaignForm from './CampaignForm';
    import PreviewModal from './Modals/PreviewModal';
    import { Eye, ExternalLink, RefreshCcw, Plus, Filter, X } from 'lucide-react';
    import { SiGoogle } from "react-icons/si";


    type Row = {
    id: string;
    name: string;
    daily_budget: number;
    status: string;
    last_synced: string | null;
    google_ads_link?: string | null;
    keywords: string[];
    target_locations: string[];
    };

    export default function CampaignsTable() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [previewRow, setPreviewRow] = useState<Row | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Filter state
    const [showFilter, setShowFilter] = useState(false);
    const [tempStatusFilter, setTempStatusFilter] = useState<string>('all');
    const [tempBudgetRange, setTempBudgetRange] = useState<[number, number]>([0, 1000]);

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 1000]);

    // Filtered rows
    const filteredRows = rows.filter((row) => {
        const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
        const matchesBudget = row.daily_budget >= budgetRange[0] && row.daily_budget <= budgetRange[1];
        return matchesStatus && matchesBudget;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    const paginatedRows = filteredRows.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    async function load() {
         let session = (await supabase.auth.getSession()).data.session;
        
              // If no session, sign in the user automatically
              if (!session) {
                const { data, error: loginError } = await supabase.auth.signInWithPassword({
                  email:  process.env.EMAIL!, // replace with your user
                  password: process.env.PASSWORD!,              // replace with your password
                });
                if (loginError) throw new Error("Login failed: " + loginError.message);
                session = data.session;
                if (!session) throw new Error("Login succeeded but session is null");
              }
    if (!session) return setError('Not logged in');
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data: Row[] = await res.json();
      setRows(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

   async function handleSync(row: Row) {
    if (!row?.id) return;
    setSyncingId(row.id);
    setError(null);

    try {
        // Simulate API latency and possible failure
        await simulateApi(async () => {
            const res = await fetch(`/api/campaigns/${row.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
                body: JSON.stringify({ last_synced: new Date().toISOString() }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData?.error || 'Sync failed');
            }

            // Optionally, get updated row data from response
            const updatedRow: Row = (await res.json()).data[0];

            // Update the specific row locally instead of reloading all rows
            setRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, ...updatedRow } : r))
            );
        }, 1000, 0.1); // 1s delay, 10% chance of simulated error

    } catch (err: any) {
        console.error('Sync failed:', err);
        setError(err?.message || 'Sync failed');
    } finally {
        setSyncingId(null);
    }
}


    useEffect(() => {
        load();
    }, []);

    const handleApplyFilters = () => {
        setStatusFilter(tempStatusFilter);
        setBudgetRange(tempBudgetRange);
        setShowFilter(false);
        setCurrentPage(1);
    };

    const handleCancelFilters = () => {
        setTempStatusFilter(statusFilter);
        setTempBudgetRange(budgetRange);
        setShowFilter(false);
    };

    const handleResetFilters = () => {
        setStatusFilter('all');
        setBudgetRange([0, 1000]);
        setTempStatusFilter('all');
        setTempBudgetRange([0, 1000]);
        setCurrentPage(1);
    };

    const handleUpdateRow = (updatedRow: Row) => {
  setRows((prev) =>
    prev.map((r) => (r.id === updatedRow.id ? { ...r, ...updatedRow } : r))
  );
};

    return (
        <div className="h-[88vh] p-6 bg-white rounded-lg relative border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium">Campaigns</h2>
            <div className="flex items-center gap-4">
            <div className="relative">
                {/* Filter Icon */}
                <button
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition cursor-pointer"
                    onClick={() => setShowFilter(!showFilter)}
                >
                    <Filter size={18} />
                </button>

                {/* Filter Dropdown */}{/* Filter Panel */}
                {showFilter && (
                    <div className="absolute top-10 right-0 z-9 p-5 border border-gray-200 rounded-lg mb-4 bg-gray-50">
                    <div className="">
                        <span className="block text-lg font-semibold mb-4">Filters</span>

                        {/* Status Filter */}
                        <div className="flex flex-col mb-5">
                            <label className="text-md mb-2">Status</label>
                            <select
                                className="border rounded px-2 py-1 text-sm h-[35px]"
                                value={tempStatusFilter}
                                onChange={(e) => setTempStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        {/* Budget Filter */}
                        <div className="flex flex-col mb-5">
                            <label className="text-md mb-1">
                                Budget: ${tempBudgetRange[0]} – ${tempBudgetRange[1]}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                type="range"
                                min={0}
                                max={1000}
                                value={tempBudgetRange[0]}
                                onChange={(e) =>
                                    setTempBudgetRange([+e.target.value, tempBudgetRange[1]])
                                }
                                className="w-28"
                                />
                                <input
                                type="range"
                                min={0}
                                max={1000}
                                value={tempBudgetRange[1]}
                                onChange={(e) =>
                                    setTempBudgetRange([tempBudgetRange[0], +e.target.value])
                                }
                                className="w-28"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Apply / Cancel Buttons */}
                    <div className="flex gap-2 mt-5">
                        <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={handleApplyFilters}
                        >
                        Apply
                        </button>
                        <button
                        className="px-4 py-2 border rounded hover:bg-gray-100"
                        onClick={handleCancelFilters}
                        >
                        Cancel
                        </button>
                    </div>
                    </div>
                )}
            </div>

            {/* Reset Filters Button */}
            {(statusFilter !== 'all' || budgetRange[0] !== 0 || budgetRange[1] !== 1000) && (
                <button
                onClick={handleResetFilters}
                className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-100"
                >
                Reset Filters
                </button>
            )}

            {/* Add Campaign Button */}
            <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer"
                onClick={() => setShowForm(!showForm)}
            >
                <Plus size={18} />
                Add Campaign
            </button>
            </div>
        </div>


        {/* Modal for form */}
        {showForm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                <CampaignForm
                onCreated={() => {
                    load();
                    setShowForm(false);
                }}
                onCancel={() => setShowForm(false)}
                />
            </div>
            </div>
        )}

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="relative">
            {/* Loader Overlay */}
            {loading && (
            <div className="absolute inset-0 flex justify-center items-center bg-white/70 z-10">
                <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
                </svg>
            </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
            <table className="w-full text-left overflow-hidden">
                <thead>
                <tr>
                    <th className="p-4 ps-0 font-medium">S.No</th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Budget</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Last Synced</th>
                    <th className="p-4 font-medium">Actions</th>
                </tr>
                </thead>
                <tbody>
                {paginatedRows.map((row, index) => (
                    <tr
                    key={row.id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                    >
                    <td className="p-4 ps-0">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="p-4">{row.name || '-'}</td>
                    <td className="p-4 text-gray-500">${row.daily_budget || 0}</td>
                    <td className="p-4 text-gray-500">
                        <span
                        className={`px-3 py-1 capitalize rounded text-sm font-medium ${
                            row.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                        >
                        {row.status || '-'}
                        </span>
                    </td>
                    <td className="p-4 text-gray-500">
                        {row.last_synced
                        ? new Date(row.last_synced).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="p-4 flex gap-3">
                        <button
                            onClick={() => setPreviewRow(row)}
                            className={ 'text-blue-600 cursor-pointer hover:text-blue-800'}
                            title="Preview"
                        >
                            <Eye size={20} />
                        </button>
            
                        <button
                        onClick={() => handleSync(row)}
                        disabled={syncingId === row.id}
                        className="text-gray-600 hover:text-gray-800 cursor-pointer"
                        title="Sync Now"
                        >
                        <RefreshCcw
                            size={20}
                            className={
                            syncingId === row.id
                                ? 'animate-spin text-blue-600'
                                : ''
                            }
                        />
                        </button>
                        <a
                        href={
                            row.google_ads_link ||
                            'https://ads.google.com/aw/campaigns'
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit in Google Ads"
                        >
                        <SiGoogle size={20} />
                        </a>
                    </td>
                    </tr>
                ))}
                {paginatedRows.length === 0 && !loading && (
                    <tr>
                    <td
                        colSpan={6}
                        className="py-6 text-center text-gray-500 italic"
                    >
                        No campaigns found
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>

            {/* Pagination */}
            {filteredRows.length > rowsPerPage && (
            <div className="flex justify-center items-center mt-4 gap-2">
                <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                >
                Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                <button
                    key={i}
                    className={`px-3 py-1 border rounded ${
                    currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                >
                    {i + 1}
                </button>
                ))}
                <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                >
                Next
                </button>
            </div>
            )}
        </div>

        {/* Preview modal */}
        {previewRow && (
            <PreviewModal
            row={previewRow}
            onClose={() => setPreviewRow(null)}
            onPublish={load}
            onUpdateRow={handleUpdateRow}
            />
        )}
        </div>
    );
    }
