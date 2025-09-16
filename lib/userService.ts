import { supabase } from './supabaseClient';

export interface User {
    id: string;
    name: string;
    email: string;
    token?: string;
    google_ads_connected?: boolean;
    google_ads_last_checked?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Create or update user in Supabase
 */
export async function upsertUser(userData: {
    name: string;
    email: string;
    token?: string;
}): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .upsert(
                {
                    name: userData.name,
                    email: userData.email,
                    token: userData.token,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'email',
                    ignoreDuplicates: false,
                }
            )
            .select()
            .single();

        if (error) {
            console.error('Error upserting user:', error);
            return null;
        }

        return data as User;
    } catch (error) {
        console.error('Exception in upsertUser:', error);
        return null;
    }
}

/**
 * Get user by email from Supabase
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error getting user:', error);
            return null;
        }

        return data as User | null;
    } catch (error) {
        console.error('Exception in getUserByEmail:', error);
        return null;
    }
}

/**
 * Update user token
 */
export async function updateUserToken(email: string, token: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('users')
            .update({
                token,
                updated_at: new Date().toISOString()
            })
            .eq('email', email);

        if (error) {
            console.error('Error updating user token:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Exception in updateUserToken:', error);
        return false;
    }
}

/**
 * Update user's Google Ads connection status
 */
export async function updateGoogleAdsConnectionStatus(
    email: string,
    connected: boolean
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('users')
            .update({
                google_ads_connected: connected,
                google_ads_last_checked: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('email', email);

        if (error) {
            console.error('Error updating Google Ads connection status:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Exception in updateGoogleAdsConnectionStatus:', error);
        return false;
    }
}

/**
 * Get user's Google Ads connection status
 */
export async function getGoogleAdsConnectionStatus(email: string): Promise<{
    connected: boolean;
    lastChecked?: string;
} | null> {
    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return null;
        }

        return {
            connected: user.google_ads_connected || false,
            lastChecked: user.google_ads_last_checked || undefined,
        };
    } catch (error) {
        console.error('Exception in getGoogleAdsConnectionStatus:', error);
        return null;
    }
}