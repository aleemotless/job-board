import type { Metadata } from "next";
import { JobForm } from "@/components/job-form";
import { SectionHeader } from "@/components/common/section-header";
import { PageContainer } from "@/components/layout/container";
import { submitJobAction } from "./actions";

export const metadata: Metadata = {
    title: "Post a job",
};

export default function PostJob() {
    return (
        <PageContainer>
            <SectionHeader
                size="lg"
                eyebrow="For employers"
                title="Post a job"
                description="Submit your role. Our team reviews it before it appears on the board."
            />
            <JobForm action={submitJobAction} submitLabel="Submit job" cancelHref="/" showStatus={false} />
        </PageContainer>
    );
}
