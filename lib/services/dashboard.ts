import { cacheTag } from "next/cache";
import type { DashboardData } from "@/types";
import { getApplications } from "@/lib/data/applications";
import { getJobs } from "@/lib/data/jobs";
import { APPLICATIONS_TAG, JOBS_TAG, RECENT_APPLICATIONS_COUNT } from "@/lib/config";

export async function getDashboardData(): Promise<DashboardData> {
    "use cache";
    cacheTag(JOBS_TAG, APPLICATIONS_TAG);
    const [jobs, applications] = await Promise.all([getJobs(), getApplications()]);

    return {
        stats: {
            openJobs: jobs.filter((job) => job.status === "open").length,
            applications: applications.length,
            pendingReview: applications.filter((app) => app.status === "pending").length,
        },
        recentApplications: applications.slice(0, RECENT_APPLICATIONS_COUNT),
    };
}
