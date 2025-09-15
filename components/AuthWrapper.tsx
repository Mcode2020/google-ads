"use client";

import TokenExpirationNotice from "./TokenExpirationNotice";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { reconnect, isAuthenticated } = useGoogleAuth();

  return (
    <>
      {isAuthenticated && (
        <TokenExpirationNotice 
          warningDays={7}
          onReconnectClick={reconnect}
        />
      )}
      {children}
    </>
  );
}