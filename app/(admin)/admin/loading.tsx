import { Notice } from "@/components/common/notice";

// Suspense fallback for admin pages that read the database per request (they call `connection()`).
export default function Loading() {
    return <Notice live>Loading...</Notice>;
}
