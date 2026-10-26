import type { z } from "zod";
import type { jobInputSchema, jobSchema, jobStatusSchema, jobWithApplicationCountSchema, jobWithRequirementsSchema } from "@/lib/schemas/job";

export type JobStatus = z.infer<typeof jobStatusSchema>;

export type Job = z.infer<typeof jobSchema>;

export type JobWithApplicationCount = z.infer<typeof jobWithApplicationCountSchema>;

export type JobWithRequirements = z.infer<typeof jobWithRequirementsSchema>;

export type JobInput = z.infer<typeof jobInputSchema>;

export type JobFormState = {
    errors?: Partial<Record<keyof JobInput, string>>;
    values?: Partial<Record<keyof JobInput, string>>;
    // Error not tied to one field, e.g. the job was deleted while it was being edited.
    formError?: string;
};

// `input` is set only when the form data is valid.
export type ParsedJobForm = { input?: JobInput; state: JobFormState };
