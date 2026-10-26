import { Suspense } from "react";
import { BackLink } from "@/components/common/back-link";
import { Notice } from "@/components/common/notice";
import { PageContainer } from "@/components/layout/container";
import { JobDetailLoader } from "../_components/job-detail-loader";

// Not async: params is awaited inside <Suspense> so the rest of the page prerenders.
export default function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
    return (
        <PageContainer width="wide">
            <BackLink href="/jobs">Back to Jobs</BackLink>
            <Suspense fallback={<Notice live>Loading job...</Notice>}>
                <JobDetailLoader params={params} />
            </Suspense>
        </PageContainer>
    );
}
