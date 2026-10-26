import type { Job } from "@/types";

export function formatCompanyLocation(job: Pick<Job, "company" | "location">): string {
    return `${job.company} · ${job.location}`;
}
