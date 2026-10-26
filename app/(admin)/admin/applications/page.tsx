import type { Metadata } from "next";
import { getApplications } from "@/lib/services/applications";
import { SectionHeader } from "@/components/common/section-header";
import { ApplicationsTable } from "./_components/applications-table";

export const metadata: Metadata = {
    title: "Applications",
};

export default async function AdminApplications() {
    const applications = await getApplications();

    return (
        <>
            <SectionHeader title="Applications" />
            <ApplicationsTable applications={applications} />
        </>
    );
}
