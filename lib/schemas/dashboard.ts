import { z } from "zod";
import { applicationWithJobSchema } from "./application";

export const dashboardStatsSchema = z.object({
    openJobs: z.number(),
    applications: z.number(),
    pendingReview: z.number(),
});

export const dashboardDataSchema = z.object({
    stats: dashboardStatsSchema,
    recentApplications: z.array(applicationWithJobSchema),
});
