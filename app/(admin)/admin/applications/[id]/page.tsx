import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/common/back-link";
import { Notice } from "@/components/common/notice";
import { ApplicationDetailLoader } from "../_components/application-detail-loader";

export const metadata: Metadata = {
    title: "Review application",
};

// Not async: params is awaited inside <Suspense> so the shell prerenders.
export default function ReviewApplication({ params }: PageProps<"/admin/applications/[id]">) {
    return (
        <>
            <BackLink href="/admin/applications">Back to applications</BackLink>
            <Suspense fallback={<Notice live>Loading application...</Notice>}>
                <ApplicationDetailLoader params={params} />
            </Suspense>
        </>
    );
}
