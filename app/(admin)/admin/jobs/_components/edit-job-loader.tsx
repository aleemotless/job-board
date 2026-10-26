import { notFound } from "next/navigation";
import { getJob } from "@/lib/services/jobs";
import type { IdParamsProps } from "@/types";
import { JobForm } from "@/components/job-form";
import { updateJobAction } from "../actions";

// Data only: resolves params, fetches the job and hands it to the form.
// Awaits params itself so the page can render it inside <Suspense>.
export async function EditJobLoader({ params }: IdParamsProps) {
    const { id } = await params;
    const job = await getJob(id);
    if (!job) notFound();

    return <JobForm action={updateJobAction.bind(null, job.id)} job={job} submitLabel="Save changes" cancelHref="/admin/jobs" />;
}
