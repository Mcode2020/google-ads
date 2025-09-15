import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { Account, User } from "next-auth";
import { upsertUser, updateUserToken } from "@/lib/userService";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    access_type: "offline",
                    prompt: "consent"
                }
            }
        })
    ],

    callbacks: {
        async signIn({ user, account }: { user: User; account: Account | null }) {
            if (account?.provider === 'google' && user.email && user.name) {
                try {
                    // Store/update user in Supabase
                    const supabaseUser = await upsertUser({
                        name: user.name,
                        email: user.email,
                        token: account.access_token || undefined
                    });

                    if (!supabaseUser) {
                        console.error('Failed to store user in Supabase');
                        return false;
                    }

                    console.log('User stored in Supabase:', supabaseUser);
                    return true;
                } catch (error) {
                    console.error('Error during sign in:', error);
                    return false;
                }
            }
            return true;
        },

        async jwt({ token, account, user }: { token: JWT; account: Account | null; user?: User }) {
            // Initial sign in
            if (account) {
                token.accessToken = account.access_token;
                token.expires_at = account.expires_at;

                // Update token in Supabase if user email is available
                if (user?.email && account.access_token) {
                    await updateUserToken(user.email, account.access_token);
                }
            }

            return token;
        },

        async session({ session, token }: { session: Session; token: JWT }) {
            session.accessToken = token.accessToken as string;
            session.expires_at = token.expires_at as number;
            return session;
        }
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };