import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/common/button-link";
import { SectionHeader } from "@/components/common/section-header";
import type { Job } from "@/types";
import { JobList } from "./job-list";

type FeaturedJobsProps = { jobs: Job[] };

export function FeaturedJobs({ jobs }: FeaturedJobsProps) {
    return (
        <section aria-labelledby="featured-jobs-heading" className="flex flex-col gap-6">
            <SectionHeader
                level={2}
                size="sm"
                id="featured-jobs-heading"
                eyebrow="Latest openings"
                title="Featured jobs"
                action={
                    <ButtonLink href="/jobs" variant="link" className="px-0">
                        View all jobs <ArrowRight data-icon="inline-end" />
                    </ButtonLink>
                }
            />
            <JobList jobs={jobs} layout="grid" emptyMessage="No open jobs right now. Check back soon." />
        </section>
    );
}
