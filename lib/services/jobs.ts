import { cacheTag } from "next/cache";
import type { Job, JobInput, JobWithApplicationCount, JobWithRequirements } from "@/types";
import { getApplications } from "@/lib/data/applications";
import { createJob, getJob, getJobs } from "@/lib/data/jobs";
import { APPLICATIONS_TAG, JOBS_TAG } from "@/lib/config";

export { createJob, deleteJob, getJob, updateJob } from "@/lib/data/jobs";

export async function getJobsWithApplicationCounts(): Promise<JobWithApplicationCount[]> {
    "use cache";
    cacheTag(JOBS_TAG, APPLICATIONS_TAG);
    const [jobs, applications] = await Promise.all([getJobs(), getApplications()]);
    return jobs.map((job) => ({
        ...job,
        applicationCount: applications.filter((app) => app.jobId === job.id).length,
    }));
}

// Newest first; `limit` omitted returns all of them.
export async function getOpenJobs(limit?: number): Promise<Job[]> {
    "use cache";
    cacheTag(JOBS_TAG);
    const jobs = await getJobs();
    return jobs.filter((job) => job.status === "open").slice(0, limit);
}

// Requirements are stored one per line; drop blank lines, typed bullet markers and
// duplicates (each line is also its list key).
function toRequirementList(requirements: string): string[] {
    const lines = requirements.split("\n").map((line) => line.replace(/^\s*[-*•]\s*/, "").trim());
    return [...new Set(lines.filter(Boolean))];
}

// The public site only shows open jobs; anything else reads as missing.
export async function getOpenJob(id: string): Promise<JobWithRequirements | undefined> {
    const job = await getJob(id);
    return job?.status === "open" ? { ...job, requirementList: toRequirementList(job.requirements) } : undefined;
}

// Public submissions are always saved as closed, so nothing goes live until an
// admin opens it from the dashboard.
export async function submitJob(input: JobInput): Promise<Job> {
    return createJob({ ...input, status: "closed" });
}
