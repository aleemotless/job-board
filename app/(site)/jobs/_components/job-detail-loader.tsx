import { notFound } from "next/navigation";
import { getOpenJob } from "@/lib/services/jobs";
import type { IdParamsProps } from "@/types";
import { JobDetail } from "./job-detail";

// Data only: resolves params, fetches the job and hands it to the view.
// Awaits params itself so the page can render it inside <Suspense>.
export async function JobDetailLoader({ params }: IdParamsProps) {
    const { id } = await params;
    const job = await getOpenJob(id);
    if (!job) notFound();

    return <JobDetail job={job} />;
}
