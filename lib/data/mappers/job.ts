import type { Job, JobWithApplicationCount } from "@/types";
import type { JobRecord, JobWithApplicationCountRecord } from "../models/job";

export function toJob(job: JobRecord): Job {
    return {
        id: job._id.toString(),
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        salary: job.salary,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
    };
}

export function toJobWithApplicationCount(job: JobWithApplicationCountRecord): JobWithApplicationCount {
    return { ...toJob(job), applicationCount: job.applicationCount };
}
