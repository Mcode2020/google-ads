import "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        refreshToken?: string;
        expires_at?: number;
    }

    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        expires_at?: number;
    }
}