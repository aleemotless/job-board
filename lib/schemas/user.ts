import { z } from "zod";
import { EMAIL_PATTERN, USER_FIELD_LIMITS, USER_ROLES } from "@/lib/config";

export const userRoleSchema = z.enum(USER_ROLES);

// Never carries the password hash.
export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: userRoleSchema,
    createdAt: z.string(),
});

// Lowercased so the same address always finds the same account.
const emailField = z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(USER_FIELD_LIMITS.email, "Enter a valid email address.")
    .regex(EMAIL_PATTERN, "Enter a valid email address.")
    .toLowerCase();

export const signUpInputSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required.")
        .max(USER_FIELD_LIMITS.name, `Name must be at most ${USER_FIELD_LIMITS.name} characters.`),
    email: emailField,
    password: z
        .string()
        .min(USER_FIELD_LIMITS.passwordMin, `Password must be at least ${USER_FIELD_LIMITS.passwordMin} characters.`)
        .max(USER_FIELD_LIMITS.passwordMax, `Password must be at most ${USER_FIELD_LIMITS.passwordMax} characters.`),
});

// No length rules here: a wrong password should read as "wrong", not reveal the sign-up rules.
export const signInInputSchema = z.object({
    email: emailField,
    password: z.string().min(1, "Password is required."),
});
