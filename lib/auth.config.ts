// Auth.js settings shared by lib/auth.ts and proxy.ts. Kept free of providers so the proxy can read the
// session JWT (and the role it carries) without bundling mongoose or bcrypt.

import type { NextAuthConfig } from "next-auth";
import { SIGN_IN_PATH } from "@/lib/config";

export const authConfig = {
    session: { strategy: "jwt" },
    pages: { signIn: SIGN_IN_PATH },
    // Caddy forwards the original Host header, and the site and admin subdomains share this app.
    trustHost: true,
    providers: [],
    callbacks: {
        jwt({ token, user }) {
            // `user` is only set on sign-in; later requests keep what the token already holds.
            if (user?.id) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id;
            session.user.role = token.role;
            return session;
        },
    },
} satisfies NextAuthConfig;
