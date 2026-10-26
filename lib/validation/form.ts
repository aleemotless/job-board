import { z } from "zod";

// The form's text entries as a plain object (files dropped): the input to safeParse,
// and the values the form is re-filled with after a failed submit.
export function formTextValues(formData: FormData): Record<string, string> {
    return Object.fromEntries([...formData].filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

// The first error message for each field, in the shape the form's `errors` state expects.
export function firstFieldErrors<Input>(error: z.ZodError<Input>) {
    const { fieldErrors } = z.flattenError(error);
    const errors: Partial<Record<keyof typeof fieldErrors, string>> = {};
    for (const key in fieldErrors) errors[key] = fieldErrors[key]?.[0];
    return errors;
}
