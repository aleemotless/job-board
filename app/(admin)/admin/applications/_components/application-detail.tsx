import { Download } from "lucide-react";
import { formatDate } from "@/lib/format/date";
import { formatFileSize } from "@/lib/format/file";
import { APPLICATION_STATUSES } from "@/lib/config";
import type { ApplicationWithJob } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ActionButton } from "@/components/common/action-button";
import { ActionForm } from "@/components/form/action-form.client";
import { FormError } from "@/components/form/form-error.client";
import { LabeledSection } from "@/components/common/labeled-section";
import { Notice } from "@/components/common/notice";
import { SectionHeader } from "@/components/common/section-header";
import { deleteApplicationAction, updateApplicationStatusAction } from "../actions";
import { StatusBadge } from "../../_components/status-badge";

type ApplicationDetailProps = { application: ApplicationWithJob };

export function ApplicationDetail({ application: app }: ApplicationDetailProps) {
    return (
        <article className="flex flex-col gap-6">
            <SectionHeader
                title={app.name}
                description={`${app.email} · applied for ${app.job?.title ?? "a deleted job"} on ${formatDate(app.createdAt)}`}
                action={<StatusBadge status={app.status} />}
            />

            <Card>
                <CardContent className="flex flex-col gap-8">
                    <LabeledSection title="CV">
                        {app.cv ? (
                            <Button asChild variant="outline" className="self-start">
                                {/* Plain <a>: a file download from a route handler, not a page navigation. */}
                                <a href={`/admin/applications/${app.id}/cv`} download>
                                    <Download data-icon="inline-start" />
                                    {app.cv.fileName} ({formatFileSize(app.cv.size)})
                                </a>
                            </Button>
                        ) : (
                            <Notice>No CV attached.</Notice>
                        )}
                    </LabeledSection>
                    <Separator />
                    <LabeledSection title="Cover letter">
                        {app.coverLetter ? <p className="text-base whitespace-pre-wrap">{app.coverLetter}</p> : <Notice>No cover letter.</Notice>}
                    </LabeledSection>
                </CardContent>
            </Card>

            <LabeledSection title="Set status">
                {/* One form; the clicked button sends its status value. */}
                <ActionForm action={updateApplicationStatusAction.bind(null, app.id)} initialState={{}} className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3">
                        {APPLICATION_STATUSES.map((status) => (
                            <Button key={status} type="submit" name="status" value={status} disabled={status === app.status} variant="outline" className="capitalize">
                                {status}
                            </Button>
                        ))}
                    </div>
                    <FormError />
                </ActionForm>
            </LabeledSection>

            <ActionButton action={deleteApplicationAction.bind(null, app.id)} pendingLabel="Deleting...">
                Delete application
            </ActionButton>
        </article>
    );
}
