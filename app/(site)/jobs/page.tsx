import type { Metadata } from "next";
import { getOpenJobs } from "@/lib/services/jobs";
import { SectionHeader } from "@/components/common/section-header";
import { PageContainer } from "@/components/layout/container";
import { JobList } from "../_components/job-list";

export const metadata: Metadata = {
    title: "Jobs",
};

export default async function Jobs() {
    const jobs = await getOpenJobs();

    return (
        <PageContainer>
            <SectionHeader size="lg" eyebrow={`${jobs.length} open ${jobs.length === 1 ? "role" : "roles"}`} title="Job Listings" description="Browse available job opportunities." />
            <JobList jobs={jobs} />
        </PageContainer>
    );
}
