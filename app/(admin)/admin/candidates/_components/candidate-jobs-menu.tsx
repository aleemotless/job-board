import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Candidate } from "@/types";
import { StatusBadge } from "../../_components/status-badge";

type CandidateJobsMenuProps = { candidate: Candidate };

// "2 jobs ▾": each item opens that application's review page.
export function CandidateJobsMenu({ candidate }: CandidateJobsMenuProps) {
    const count = candidate.applications.length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    {`${count} ${count === 1 ? "job" : "jobs"}`}
                    <ChevronDown data-icon="inline-end" />
                </Button>
            </DropdownMenuTrigger>
            {/* Sized to the job titles, not the trigger (the shadcn default). */}
            <DropdownMenuContent align="start" className="w-auto min-w-56">
                <DropdownMenuLabel className="label-caps">Applied for</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {candidate.applications.map((app) => (
                    <DropdownMenuItem key={app.id} asChild>
                        <Link href={`/admin/applications/${app.id}`} className="justify-between gap-4 whitespace-nowrap">
                            {app.job?.title ?? "Deleted job"}
                            <StatusBadge status={app.status} />
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
