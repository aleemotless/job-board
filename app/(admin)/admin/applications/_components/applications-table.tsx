import { ButtonLink } from "@/components/common/button-link";
import { DataTable } from "@/components/common/data-table";
import { TwoLineCell } from "@/components/common/two-line-cell";
import type { ApplicationListProps, ApplicationWithJob, DataTableColumn } from "@/types";
import { StatusBadge } from "../../_components/status-badge";

const columns: DataTableColumn<ApplicationWithJob>[] = [
    { header: "Applicant", cell: (app) => <TwoLineCell primary={app.name} secondary={app.email} /> },
    { header: "Job", cell: (app) => app.job?.title ?? "Deleted job" },
    { header: "Status", cell: (app) => <StatusBadge status={app.status} /> },
    {
        header: "Actions",
        align: "right",
        cell: (app) => (
            <ButtonLink href={`/admin/applications/${app.id}`} variant="outline" size="sm">
                Review
            </ButtonLink>
        ),
    },
];

export function ApplicationsTable({ applications }: ApplicationListProps) {
    return <DataTable rows={applications} columns={columns} emptyMessage="No applications yet." />;
}
