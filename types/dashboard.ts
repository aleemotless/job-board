import type { z } from "zod";
import type { dashboardDataSchema, dashboardStatsSchema } from "@/lib/schemas/dashboard";

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export type DashboardData = z.infer<typeof dashboardDataSchema>;
