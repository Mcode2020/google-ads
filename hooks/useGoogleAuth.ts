"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback } from "react";
import { isTokenExpired } from "@/utils/tokenExpiration";

export function useGoogleAuth() {
    const { data: session, status } = useSession();

    const isAuthenticated = status === "authenticated" && session;
    const isLoading = status === "loading";

    const isExpired = session?.expires_at ? isTokenExpired(session.expires_at) : false;

    const reconnect = useCallback(async () => {
        try {
            // First sign out to clear the expired session
            await signOut({ redirect: false });
            // Then sign in again to get a fresh token
            await signIn("google", { redirect: false });
        } catch (error) {
            console.error("Error during reconnection:", error);
        }
    }, []);

    const login = useCallback(async () => {
        try {
            await signIn("google", { redirect: false });
        } catch (error) {
            console.error("Error during login:", error);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut({ redirect: false });
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }, []);

    return {
        session,
        isAuthenticated,
        isLoading,
        isExpired,
        reconnect,
        login,
        logout
    };
}