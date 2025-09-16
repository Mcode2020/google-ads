'use client';
import React, { useState, useCallback } from 'react';
import CampaignsTable from '@/components/CampaignsTable';
import AuthButton from '@/components/AuthButton';
import GoogleAdsIntegration from '@/components/GoogleAdsIntegration';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session;
  const [isGoogleAdsConnected, setIsGoogleAdsConnected] = useState<boolean>(false);
  
  const updateGoogleAdsConnections = useCallback((connected: boolean) => {
    setIsGoogleAdsConnected(connected);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-4">Welcome to AdsPilot</h1>
          <p className="text-gray-600 mb-6">Please sign in with your Google account to access your campaigns.</p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-semibold">AdsPilot — Campaigns</h1>
        <h1 className='text-sm text-green-600'>Test Mode</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {session?.user?.name || session?.user?.email}
          </span>
          <AuthButton />
        </div>
      </div>
      
      {/* Google Ads Integration Section */}
      <div className="mb-8">
        <GoogleAdsIntegration updateGoogleAdsConnections={updateGoogleAdsConnections} />
      </div>
      
      {/* Original Campaigns Table */}
      <div className="">
        <CampaignsTable isGoogleAdsConnected={isGoogleAdsConnected} />
      </div>
    </div>
  );
}
