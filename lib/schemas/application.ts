import { z } from "zod";
import { APPLICATION_FIELD_LIMITS, APPLICATION_STATUSES, CV_TYPES, EMAIL_PATTERN, MAX_CV_BYTES } from "@/lib/config";
import { formatFileSize } from "@/lib/format/file";
import { jobSchema } from "./job";

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const cvFileSchema = z.object({ fileName: z.string(), contentType: z.string(), size: z.number() });

export const storedCvSchema = cvFileSchema.extend({ data: z.instanceof(Uint8Array) });

export const applicationSchema = z.object({
    id: z.string(),
    jobId: z.string(),
    name: z.string(),
    email: z.string(),
    coverLetter: z.string(),
    // Metadata only; the file bytes live in S3, keyed by application id,
    // so cached reads never carry file data.
    cv: cvFileSchema.nullable(),
    status: applicationStatusSchema,
    createdAt: z.string(),
});

export const applicationWithJobSchema = applicationSchema.extend({ job: jobSchema.pick({ id: true, title: true }).nullable() });

export const applicationInputSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required.")
        .max(APPLICATION_FIELD_LIMITS.name, `Name must be at most ${APPLICATION_FIELD_LIMITS.name} characters.`),
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .max(APPLICATION_FIELD_LIMITS.email, "Enter a valid email address.")
        .regex(EMAIL_PATTERN, "Enter a valid email address."),
    coverLetter: z
        .string()
        .trim()
        .max(APPLICATION_FIELD_LIMITS.coverLetter, `Cover letter must be at most ${APPLICATION_FIELD_LIMITS.coverLetter} characters.`),
});

// The content type we'll store and serve the file as, or undefined if it isn't an allowed CV.
function cvContentType(file: File): string | undefined {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const entry = Object.entries(CV_TYPES).find(([ext]) => ext === extension);
    if (!entry) return undefined;
    // Some browsers send an empty or generic type.
    const [, type] = entry;
    return file.type === type || file.type === "" || file.type === "application/octet-stream" ? type : undefined;
}

// An uploaded CV, turned into the file plus the content type we picked for its extension.
export const cvUploadSchema = z
    .instanceof(File, { error: "Attach your CV." })
    .refine((file) => file.size > 0, { error: "Attach your CV.", abort: true })
    .refine((file) => file.size <= MAX_CV_BYTES, { error: `CV must be ${formatFileSize(MAX_CV_BYTES)} or smaller.`, abort: true })
    .transform((file, ctx) => {
        const contentType = cvContentType(file);
        if (!contentType) {
            ctx.addIssue({ code: "custom", message: "CV must be a PDF file." });
            return z.NEVER;
        }
        return { file, contentType };
    });

export const applicationFormSchema = applicationInputSchema.extend({ cv: cvUploadSchema });
