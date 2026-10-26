import { jobInputSchema } from "@/lib/schemas/job";
import type { ParsedJobForm } from "@/types";
import { firstFieldErrors, formTextValues } from "./form";

export function parseJobForm(formData: FormData): ParsedJobForm {
    const values = formTextValues(formData);
    const result = jobInputSchema.safeParse(values);

    return result.success ? { input: result.data, state: {} } : { state: { errors: firstFieldErrors(result.error), values } };
}
