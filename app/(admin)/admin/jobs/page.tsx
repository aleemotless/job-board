import type { Metadata } from "next";
import { getJobsWithApplicationCounts } from "@/lib/services/jobs";
import { ButtonLink } from "@/components/common/button-link";
import { SectionHeader } from "@/components/common/section-header";
import { JobsTable } from "./_components/jobs-table";

export const metadata: Metadata = {
    title: "Jobs",
};

export default async function AdminJobs() {
    const jobs = await getJobsWithApplicationCounts();

    return (
        <>
            <SectionHeader
                title="Jobs"
                action={<ButtonLink href="/admin/jobs/new">New job</ButtonLink>}
            />
            <JobsTable jobs={jobs} />
        </>
    );
}
