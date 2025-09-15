import "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        expires_at?: number;
    }

    interface JWT {
        accessToken?: string;
        expires_at?: number;
    }
}