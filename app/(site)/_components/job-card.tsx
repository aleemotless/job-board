import { ButtonLink } from "@/components/common/button-link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompanyLocation } from "@/lib/format/job";
import type { Job } from "@/types";

type JobCardProps = { job: Job };

export function JobCard({ job }: JobCardProps) {
    return (
        <Card className="brutal-hover h-full">
            <CardHeader>
                <CardTitle className="font-display text-2xl">{job.title}</CardTitle>
                <CardDescription>{formatCompanyLocation(job)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="line-clamp-3">{job.description}</p>
            </CardContent>
            <CardFooter>
                <ButtonLink href={`/jobs/${job.id}`} variant="secondary">
                    View Details
                </ButtonLink>
            </CardFooter>
        </Card>
    );
}
