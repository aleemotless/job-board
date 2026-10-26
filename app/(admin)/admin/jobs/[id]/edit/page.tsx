import type { Metadata } from "next";
import { Suspense } from "react";
import { Notice } from "@/components/common/notice";
import { SectionHeader } from "@/components/common/section-header";
import { EditJobLoader } from "../../_components/edit-job-loader";

export const metadata: Metadata = {
    title: "Edit job",
};

// Not async: params is awaited inside <Suspense> so the shell prerenders.
export default function EditJob({ params }: PageProps<"/admin/jobs/[id]/edit">) {
    return (
        <>
            <SectionHeader title="Edit job" />
            <Suspense fallback={<Notice live>Loading job...</Notice>}>
                <EditJobLoader params={params} />
            </Suspense>
        </>
    );
}
