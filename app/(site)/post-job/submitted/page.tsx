import type { Metadata } from "next";
import { ButtonLink } from "@/components/common/button-link";
import { MessageCard } from "@/components/common/message-card";
import { PageContainer } from "@/components/layout/container";

export const metadata: Metadata = {
    title: "Job submitted",
};

export default function JobSubmitted() {
    return (
        <PageContainer>
            <MessageCard
                level={1}
                title="Thanks! Your job was submitted."
                description="We'll review it and publish it on the board once it's approved."
                actions={
                    <>
                        <ButtonLink href="/jobs">Browse jobs</ButtonLink>
                        <ButtonLink href="/post-job" variant="outline">
                            Post another
                        </ButtonLink>
                    </>
                }
            />
        </PageContainer>
    );
}
