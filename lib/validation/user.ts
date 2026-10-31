import { signInInputSchema, signUpInputSchema } from "@/lib/schemas/user";
import type { ParsedSignInForm, ParsedSignUpForm } from "@/types";
import { firstFieldErrors, formTextValues } from "./form";

export function parseSignUpForm(formData: FormData): ParsedSignUpForm {
    const { name, email, password } = formTextValues(formData);
    const result = signUpInputSchema.safeParse({ name, email, password });
    if (!result.success) return { state: { errors: firstFieldErrors(result.error), values: { name, email } } };
    return { input: result.data, state: {} };
}

export function parseSignInForm(formData: FormData): ParsedSignInForm {
    const { email, password } = formTextValues(formData);
    const result = signInInputSchema.safeParse({ email, password });
    if (!result.success) return { state: { errors: firstFieldErrors(result.error), values: { email } } };
    return { input: result.data, state: {} };
}
