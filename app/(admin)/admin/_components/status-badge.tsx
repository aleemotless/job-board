import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus, JobStatus } from "@/types";

type StatusBadgeProps = { status: JobStatus | ApplicationStatus };

const variants: Record<JobStatus | ApplicationStatus, ComponentProps<typeof Badge>["variant"]> = {
    open: "success",
    accepted: "success",
    closed: "outline",
    pending: "secondary",
    reviewing: "default",
    rejected: "destructive",
};

export function StatusBadge({ status }: StatusBadgeProps) {
    return <Badge variant={variants[status]}>{status}</Badge>;
}
