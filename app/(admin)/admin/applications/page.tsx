import type { Metadata } from "next";
import { connection } from "next/server";
import { getApplications } from "@/lib/services/applications";
import { SectionHeader } from "@/components/common/section-header";
import { ApplicationsTable } from "./_components/applications-table";

export const metadata: Metadata = {
    title: "Applications",
};

export default async function AdminApplications() {
    // Rendered per request, not at build time, so building the app never needs the database.
    await connection();
    const applications = await getApplications();

    return (
        <>
            <SectionHeader title="Applications" />
            <ApplicationsTable applications={applications} />
        </>
    );
}
