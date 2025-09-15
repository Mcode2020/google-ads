/**
 * Utility functions for handling Google OAuth token expiration
 */

export interface TokenInfo {
    expires_at: number;
    isExpiringSoon: boolean;
    daysUntilExpiration: number;
}

/**
 * Check if a token is expiring within the specified number of days
 * @param expiresAt - Token expiration timestamp
 * @param warningDays - Number of days before expiration to show warning (default: 7)
 * @returns Token information including expiration status
 */
export function checkTokenExpiration(expiresAt: number, warningDays: number = 7): TokenInfo {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeUntilExpiration = expiresAt - now;
    const daysUntilExpiration = Math.floor(timeUntilExpiration / (24 * 60 * 60));

    return {
        expires_at: expiresAt,
        isExpiringSoon: daysUntilExpiration <= warningDays && daysUntilExpiration > 0,
        daysUntilExpiration: Math.max(0, daysUntilExpiration)
    };
}

/**
 * Check if a token is already expired
 * @param expiresAt - Token expiration timestamp
 * @returns True if token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    return expiresAt <= now;
}

/**
 * Format the expiration message
 * @param daysUntilExpiration - Number of days until expiration
 * @returns Formatted message string
 */
export function getExpirationMessage(daysUntilExpiration: number): string {
    if (daysUntilExpiration === 0) {
        return "Your Google token expires today!";
    } else if (daysUntilExpiration === 1) {
        return "Your Google token expires tomorrow!";
    } else {
        return `Your Google token expires in ${daysUntilExpiration} days!`;
    }
}