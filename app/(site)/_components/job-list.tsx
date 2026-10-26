import { Notice } from "@/components/common/notice";
import type { Job } from "@/types";
import { JobCard } from "./job-card";

const layouts = { list: "flex flex-col gap-6", grid: "grid grid-cols-1 gap-6 md:grid-cols-3" } as const;

type JobListProps = {
    jobs: Job[];
    layout?: keyof typeof layouts;
    emptyMessage?: string;
};

export function JobList({ jobs, layout = "list", emptyMessage = "No open jobs right now." }: JobListProps) {
    if (jobs.length === 0) return <Notice variant="card">{emptyMessage}</Notice>;

    return (
        <ul className={layouts[layout]}>
            {jobs.map((job) => (
                <li key={job.id}>
                    <JobCard job={job} />
                </li>
            ))}
        </ul>
    );
}
