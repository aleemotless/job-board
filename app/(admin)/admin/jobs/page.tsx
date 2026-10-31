import type { Metadata } from "next";
import { connection } from "next/server";
import { getJobsWithApplicationCounts } from "@/lib/services/jobs";
import { ButtonLink } from "@/components/common/button-link";
import { SectionHeader } from "@/components/common/section-header";
import { JobsTable } from "./_components/jobs-table";

export const metadata: Metadata = {
    title: "Jobs",
};

export default async function AdminJobs() {
    // Rendered per request, not at build time, so building the app never needs the database.
    await connection();
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
