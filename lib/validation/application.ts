import { applicationFormSchema } from "@/lib/schemas/application";
import type { ParsedApplicationForm } from "@/types";
import { firstFieldErrors, formTextValues } from "./form";

export function parseApplicationForm(formData: FormData): ParsedApplicationForm {
    const values = formTextValues(formData);
    const result = applicationFormSchema.safeParse({ ...values, cv: formData.get("cv") });
    if (!result.success) return { state: { errors: firstFieldErrors(result.error), values } };

    const { cv, ...input } = result.data;
    return { input, cv, state: {} };
}
