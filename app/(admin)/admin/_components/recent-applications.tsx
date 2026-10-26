import Link from "next/link";
import { DataTable } from "@/components/common/data-table";
import { TwoLineCell } from "@/components/common/two-line-cell";
import type { ApplicationListProps, ApplicationWithJob, DataTableColumn } from "@/types";
import { StatusBadge } from "./status-badge";

const columns: DataTableColumn<ApplicationWithJob>[] = [
    {
        header: "Applicant",
        cell: (app) => (
            <TwoLineCell
                primary={
                    <Link href={`/admin/applications/${app.id}`} className="hover:underline">
                        {app.name}
                    </Link>
                }
                secondary={`for ${app.job?.title ?? "deleted job"}`}
            />
        ),
    },
    { header: "Status", align: "right", cell: (app) => <StatusBadge status={app.status} /> },
];

export function RecentApplications({ applications }: ApplicationListProps) {
    return <DataTable title="Recent applications" hideHeader rows={applications} columns={columns} emptyMessage="No applications yet." />;
}
