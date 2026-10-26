import { Banknote } from "lucide-react";
import { formatCompanyLocation } from "@/lib/format/job";
import type { JobWithRequirements } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { applyToJobAction } from "../actions";
import { ApplyForm } from "./apply-form";
import { LabeledSection } from "@/components/common/labeled-section";

type JobDetailProps = { job: JobWithRequirements };

export function JobDetail({ job }: JobDetailProps) {
    return (
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <Card>
                <CardHeader className="gap-3">
                    <CardTitle>
                        <h1 className="text-4xl sm:text-5xl">{job.title}</h1>
                    </CardTitle>
                    <CardDescription className="label-caps">{formatCompanyLocation(job)}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-8">
                    <LabeledSection title="Salary">
                        <p className="flex items-center gap-2 font-display text-2xl">
                            <Banknote aria-hidden className="size-6" />
                            {job.salary}
                        </p>
                    </LabeledSection>
                    <Separator />
                    <LabeledSection title="Description">
                        <p className="text-lg whitespace-pre-wrap">{job.description}</p>
                    </LabeledSection>
                    <Separator />
                    <LabeledSection title="Requirements">
                        <ul className="flex list-disc flex-col gap-2 pl-6 text-lg marker:text-ring">
                            {job.requirementList.map((requirement) => (
                                <li key={requirement}>{requirement}</li>
                            ))}
                        </ul>
                    </LabeledSection>
                </CardContent>
            </Card>
            {/* Right-hand column on large screens; below the description on small ones. */}
            <aside aria-label="Apply for this job" className="lg:sticky lg:top-24">
                <ApplyForm action={applyToJobAction.bind(null, job.id)} />
            </aside>
        </div>
    );
}
