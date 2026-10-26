import type { Metadata } from "next";
import { JobForm } from "@/components/job-form";
import { SectionHeader } from "@/components/common/section-header";
import { createJobAction } from "../actions";

export const metadata: Metadata = {
    title: "New job",
};

export default function NewJob() {
    return (
        <>
            <SectionHeader title="New job" />
            <JobForm action={createJobAction} submitLabel="Create job" cancelHref="/admin/jobs" />
        </>
    );
}
