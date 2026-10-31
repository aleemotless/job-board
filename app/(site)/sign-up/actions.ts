"use server";

import { signIn } from "@/lib/auth";
import { signUp } from "@/lib/services/users";
import { parseSignUpForm } from "@/lib/validation/user";
import type { SignUpFormState } from "@/types";

// Public. Creates a candidate account, then signs it in and redirects home.
export async function signUpAction(_prev: SignUpFormState, formData: FormData): Promise<SignUpFormState> {
    const { input, state } = parseSignUpForm(formData);
    if (!input) return state;

    const result = await signUp(input);
    if (!result.ok) {
        return { errors: { email: "An account with this email already exists." }, values: { name: input.name, email: input.email } };
    }

    await signIn("credentials", { email: input.email, password: input.password, redirectTo: "/" });
    return {};
}
