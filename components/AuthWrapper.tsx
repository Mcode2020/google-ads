"use client";

import { useSession } from "next-auth/react";
import TokenExpirationNotice from "./TokenExpirationNotice";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session;

  const handleReconnect = () => {
    // Redirect to login page or trigger re-authentication
    window.location.href = '/api/auth/signin';
  };

  return (
    <>
      {isAuthenticated && (
        <TokenExpirationNotice 
          warningDays={7}
          onReconnectClick={handleReconnect}
        />
      )}
      {children}
    </>
  );
}