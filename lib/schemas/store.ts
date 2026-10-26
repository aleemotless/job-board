import { z } from "zod";
import { applicationSchema, storedCvSchema } from "./application";
import { jobSchema } from "./job";

// Shape of the in-memory mock database (lib/data/store.ts).
export const mockStoreSchema = z.object({
    jobs: z.array(jobSchema),
    applications: z.array(applicationSchema),
    cvs: z.record(z.string(), storedCvSchema),
});
