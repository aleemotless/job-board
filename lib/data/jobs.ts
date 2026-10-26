import { cacheTag } from "next/cache";
import type { Job, JobInput } from "@/types";
import { newId, store } from "./store";
import { JOBS_TAG } from "@/lib/config";

export async function getJobs(): Promise<Job[]> {
    "use cache";
    cacheTag(JOBS_TAG);
    return [...store.jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJob(id: string): Promise<Job | undefined> {
    "use cache";
    cacheTag(JOBS_TAG);
    return store.jobs.find((job) => job.id === id);
}

export async function createJob(input: JobInput): Promise<Job> {
    const job: Job = { ...input, id: newId(), createdAt: new Date().toISOString() };
    store.jobs.push(job);
    return job;
}

export async function updateJob(id: string, input: JobInput): Promise<Job | undefined> {
    const job = store.jobs.find((j) => j.id === id);
    if (job) Object.assign(job, input);
    return job;
}

// Also removes the job's applications and their CVs.
export async function deleteJob(id: string): Promise<void> {
    store.jobs = store.jobs.filter((job) => job.id !== id);
    for (const app of store.applications) if (app.jobId === id) delete store.cvs[app.id];
    store.applications = store.applications.filter((app) => app.jobId !== id);
}
