"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { isTokenExpired } from "@/utils/tokenExpiration";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session;
  const isExpired = session?.expires_at ? isTokenExpired(session.expires_at) : false;

  const handleAuth = async () => {
    setIsProcessing(true);
    try {
      if (!isAuthenticated) {
        await signIn('google');
      } else if (isExpired) {
        await signIn('google', { prompt: 'consent' });
      } else {
        await signOut();
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleAuth}
      disabled={isProcessing}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
        ${isProcessing 
          ? 'bg-gray-300 cursor-not-allowed' 
          : isAuthenticated && !isExpired
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
      `}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Processing...</span>
        </>
      ) : isAuthenticated && !isExpired ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span>Sign Out</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{isExpired ? 'Reconnect Google' : 'Sign in with Google'}</span>
        </>
      )}
    </button>
  );
}