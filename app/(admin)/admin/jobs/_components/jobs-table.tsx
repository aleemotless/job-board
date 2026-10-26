import { ActionButton } from "@/components/common/action-button";
import { ButtonLink } from "@/components/common/button-link";
import { DataTable } from "@/components/common/data-table";
import { TwoLineCell } from "@/components/common/two-line-cell";
import type { DataTableColumn, JobWithApplicationCount } from "@/types";
import { deleteJobAction } from "../actions";
import { StatusBadge } from "../../_components/status-badge";

type JobsTableProps = { jobs: JobWithApplicationCount[] };

const columns: DataTableColumn<JobWithApplicationCount>[] = [
    { header: "Title", cell: (job) => <TwoLineCell primary={job.title} secondary={job.company} /> },
    { header: "Location", cell: (job) => job.location },
    { header: "Status", cell: (job) => <StatusBadge status={job.status} /> },
    { header: "Applications", align: "right", cell: (job) => job.applicationCount },
    {
        header: "Actions",
        align: "right",
        cell: (job) => (
            <div className="flex justify-end gap-2">
                <ButtonLink href={`/admin/jobs/${job.id}/edit`} variant="outline" size="sm">
                    Edit
                </ButtonLink>
                <ActionButton action={deleteJobAction.bind(null, job.id)} pendingLabel="Deleting..." size="sm">
                    Delete
                </ActionButton>
            </div>
        ),
    },
];

export function JobsTable({ jobs }: JobsTableProps) {
    return <DataTable rows={jobs} columns={columns} emptyMessage="No jobs yet." />;
}
