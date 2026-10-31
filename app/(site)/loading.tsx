import { Notice } from "@/components/common/notice";
import { PageContainer } from "@/components/layout/container";

// Suspense fallback for site pages that read the database per request (they call `connection()`).
export default function Loading() {
    return (
        <PageContainer>
            <Notice live>Loading...</Notice>
        </PageContainer>
    );
}
