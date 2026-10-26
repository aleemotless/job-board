import { Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import { TwoLineCell } from "@/components/common/two-line-cell";
import { formatDate } from "@/lib/format/date";
import type { Candidate, DataTableColumn } from "@/types";
import { CandidateJobsMenu } from "./candidate-jobs-menu";
import { StatusBadge } from "../../_components/status-badge";

type CandidatesTableProps = { candidates: Candidate[] };

const columns: DataTableColumn<Candidate>[] = [
    { header: "Candidate", cell: (candidate) => <TwoLineCell primary={candidate.name} secondary={candidate.email} /> },
    { header: "Applications", cell: (candidate) => <CandidateJobsMenu candidate={candidate} /> },
    { header: "Furthest stage", cell: (candidate) => <StatusBadge status={candidate.stage} /> },
    {
        header: "Last applied",
        cell: (candidate) => (
            <TwoLineCell primary={formatDate(candidate.lastAppliedAt)} secondary={`since ${formatDate(candidate.firstAppliedAt)}`} />
        ),
    },
    {
        header: "Actions",
        align: "right",
        cell: (candidate) => (
            <div className="flex justify-end gap-2">
                {/* Plain <a>: mailto and a file download, not page navigations. */}
                <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${candidate.email}`}>
                        <Mail data-icon="inline-start" />
                        Email
                    </a>
                </Button>
                {candidate.latestCv && (
                    <Button asChild variant="outline" size="sm">
                        <a href={`/admin/applications/${candidate.latestCv.applicationId}/cv`} download title={candidate.latestCv.fileName}>
                            <Download data-icon="inline-start" />
                            CV
                        </a>
                    </Button>
                )}
            </div>
        ),
    },
];

export function CandidatesTable({ candidates }: CandidatesTableProps) {
    return <DataTable rows={candidates} columns={columns} emptyMessage="No candidates yet." />;
}
