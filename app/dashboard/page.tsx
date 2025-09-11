'use client';
import React from 'react';
import CampaignForm from '@/components/CampaignForm';
import CampaignsTable from '@/components/CampaignsTable';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-5">AdsPilot — Campaigns</h1>
        <div className="">
          <CampaignsTable key={refreshKey} />
        </div>
        
    </div>
  );
}
