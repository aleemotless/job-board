// Auth.js (next-auth v5): email + password sign-in with JWT sessions that carry the user's id and role.
// Handlers use `auth()` to read the session and `signIn`/`signOut` in Server Actions.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth.config";
import { signInInputSchema } from "@/lib/schemas/user";
import { verifyCredentials } from "@/lib/services/users";
import { SIGN_IN_PATH } from "@/lib/config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: { email: {}, password: {} },
            async authorize(credentials) {
                const parsed = signInInputSchema.safeParse(credentials);
                if (!parsed.success) return null;
                const user = await verifyCredentials(parsed.data);
                return user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
            },
        }),
    ],
});

// First line of every Server Action that needs a signed-in user: actions are public POST endpoints, so
// each one checks the session itself. Sends anyone signed out to the sign-in page.
export async function requireUser() {
    const session = await auth();
    if (!session?.user) redirect(SIGN_IN_PATH);
    return session.user;
}

// First line of every admin Server Action. proxy.ts guards admin pages, but an action can be invoked by a
// POST to any path, so the proxy alone doesn't cover it. Only crafted requests get here as a non-admin.
export async function requireAdmin() {
    const user = await requireUser();
    if (user.role !== "admin") throw new Error("Forbidden");
    return user;
}
