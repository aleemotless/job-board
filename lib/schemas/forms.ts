import { applicationFormSchema } from "./application";
import { jobInputSchema } from "./job";
import { signInInputSchema, signUpInputSchema } from "./user";

// Schemas ActionForm re-runs in the browser for live field errors. Server Components pass the
// name (zod schemas aren't serializable); the Server Action still validates with safeParse.
export const FORM_SCHEMAS = {
    job: jobInputSchema,
    application: applicationFormSchema,
    signUp: signUpInputSchema,
    signIn: signInInputSchema,
};

export type FormSchemaName = keyof typeof FORM_SCHEMAS;
