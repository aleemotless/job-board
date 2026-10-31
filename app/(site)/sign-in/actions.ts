"use server";

import { CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { ADMIN_BASE_PATH } from "@/lib/config";
import { isAdminHost } from "@/lib/hosts";
import { parseSignInForm } from "@/lib/validation/user";
import type { SignInFormState } from "@/types";

export async function signInAction(_prev: SignInFormState, formData: FormData): Promise<SignInFormState> {
    const { input, state } = parseSignInForm(formData);
    if (!input) return state;

    // On the admin host, land on the dashboard, which proxy.ts lets through for admins only.
    const redirectTo = isAdminHost((await headers()).get("host") ?? "") ? ADMIN_BASE_PATH : "/";
    try {
        // Redirects on success, which Next.js handles by throwing; only a rejected sign-in is caught.
        await signIn("credentials", { ...input, redirectTo });
    } catch (error) {
        if (error instanceof CredentialsSignin) return { formError: "Wrong email or password.", values: { email: input.email } };
        throw error;
    }
    return {};
}
