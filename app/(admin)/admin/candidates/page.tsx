import type { Metadata } from "next";
import { getCandidates } from "@/lib/services/candidates";
import { SectionHeader } from "@/components/common/section-header";
import { CandidatesTable } from "./_components/candidates-table";

export const metadata: Metadata = {
    title: "Candidates",
};

export default async function AdminCandidates() {
    const candidates = await getCandidates();

    return (
        <>
            <SectionHeader title="Candidates" description="One row per person: how far they've got, when they last applied, and their latest CV." />
            <CandidatesTable candidates={candidates} />
        </>
    );
}
