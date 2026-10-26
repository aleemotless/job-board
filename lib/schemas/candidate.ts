import { z } from "zod";
import { applicationStatusSchema, applicationWithJobSchema, cvFileSchema } from "./application";

// Not stored: derived from applications, one candidate per email address.
export const candidateSchema = z.object({
    // The lowercased email, so the same person applying twice is one candidate.
    id: z.string(),
    // From their latest application.
    name: z.string(),
    email: z.string(),
    // Newest first.
    applications: z.array(applicationWithJobSchema.pick({ id: true, status: true, job: true })),
    // How far they got across all their applications (see CANDIDATE_STAGE_ORDER).
    stage: applicationStatusSchema,
    firstAppliedAt: z.string(),
    lastAppliedAt: z.string(),
    // The CV from their newest application that has one.
    latestCv: cvFileSchema.extend({ applicationId: z.string() }).nullable(),
});
