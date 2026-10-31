import bcrypt from "bcryptjs";
import type { SignInInput, SignUpInput, User } from "@/types";
import { createUser, getUserCredentials } from "@/lib/data/users";
import { PASSWORD_HASH_ROUNDS } from "@/lib/config";

type SignUpResult = { ok: true; user: User } | { ok: false; reason: "email-taken" };

// Public sign-up only ever creates candidates.
export async function signUp({ name, email, password }: SignUpInput): Promise<SignUpResult> {
    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
    const user = await createUser({ name, email, passwordHash, role: "candidate" });
    return user ? { ok: true, user } : { ok: false, reason: "email-taken" };
}

// The user, or undefined for an unknown email or a wrong password (callers can't tell which).
export async function verifyCredentials({ email, password }: SignInInput): Promise<User | undefined> {
    const credentials = await getUserCredentials(email);
    if (!credentials || !(await bcrypt.compare(password, credentials.passwordHash))) return undefined;
    return credentials.user;
}
