import type { z } from "zod";
import type {
    applicationInputSchema,
    applicationSchema,
    applicationStatusSchema,
    applicationWithJobSchema,
    cvFileSchema,
    cvUploadSchema,
    storedCvSchema,
} from "@/lib/schemas/application";

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export type Application = z.infer<typeof applicationSchema>;

export type CvFile = z.infer<typeof cvFileSchema>;

export type StoredCv = z.infer<typeof storedCvSchema>;

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export type ApplicationWithJob = z.infer<typeof applicationWithJobSchema>;

// A CV that passed validation, with the content type we'll store and serve it as.
export type ValidCv = z.infer<typeof cvUploadSchema>;

export type ApplyFormState = {
    errors?: Partial<Record<keyof ApplicationInput | "cv", string>>;
    values?: Partial<Record<keyof ApplicationInput, string>>;
    // Error not tied to one field, e.g. the job closed while the form was open.
    formError?: string;
    submitted?: boolean;
};

// `input` and `cv` are set only when the form data is valid.
export type ParsedApplicationForm = { input?: ApplicationInput; cv?: ValidCv; state: ApplyFormState };
