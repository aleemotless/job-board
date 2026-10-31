// Adds the user's id and role to Auth.js's session, user and JWT types (set in lib/auth.ts).
import type { DefaultSession } from "next-auth";
import type { UserRole } from "./user";

declare module "next-auth" {
    interface User {
        role: UserRole;
    }

    interface Session {
        user: { id: string; role: UserRole } & DefaultSession["user"];
    }
}

// next-auth/jwt only re-exports this module, so the JWT type is augmented here.
declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        role: UserRole;
    }
}
