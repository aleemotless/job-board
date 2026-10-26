import { notFound } from "next/navigation";
import { getApplication } from "@/lib/services/applications";
import type { IdParamsProps } from "@/types";
import { ApplicationDetail } from "./application-detail";

// Data only: resolves params, fetches the application and hands it to the view.
// Awaits params itself so the page can render it inside <Suspense>.
export async function ApplicationDetailLoader({ params }: IdParamsProps) {
    const { id } = await params;
    const application = await getApplication(id);
    if (!application) notFound();

    return <ApplicationDetail application={application} />;
}
