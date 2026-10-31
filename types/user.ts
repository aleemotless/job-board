import type { z } from "zod";
import type { signInInputSchema, signUpInputSchema, userRoleSchema, userSchema } from "@/lib/schemas/user";

export type UserRole = z.infer<typeof userRoleSchema>;

export type User = z.infer<typeof userSchema>;

export type SignUpInput = z.infer<typeof signUpInputSchema>;

export type SignInInput = z.infer<typeof signInInputSchema>;

// The password is never sent back to re-fill the form.
export type SignUpFormState = {
    errors?: Partial<Record<keyof SignUpInput, string>>;
    values?: Partial<Record<Exclude<keyof SignUpInput, "password">, string>>;
    formError?: string;
};

export type SignInFormState = {
    errors?: Partial<Record<keyof SignInInput, string>>;
    values?: Partial<Record<Exclude<keyof SignInInput, "password">, string>>;
    // Wrong email or password.
    formError?: string;
};

// `input` is set only when the form data is valid.
export type ParsedSignUpForm = { input?: SignUpInput; state: SignUpFormState };
export type ParsedSignInForm = { input?: SignInInput; state: SignInFormState };
