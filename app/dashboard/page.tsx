'use client';
import React from 'react';
import CampaignsTable from '@/components/CampaignsTable';

export default function DashboardPage() {

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-5">AdsPilot — Campaigns</h1>
        <div className="">
          <CampaignsTable />
        </div>
        
    </div>
  );
}
