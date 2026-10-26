import { ButtonLink } from "@/components/common/button-link";
import { SectionHeader } from "@/components/common/section-header";
import { Card, CardContent } from "@/components/ui/card";

export function PostJobCta() {
    return (
        <section aria-labelledby="post-job-heading">
            <Card className="bg-secondary text-secondary-foreground">
                <CardContent className="py-6">
                    <SectionHeader
                        level={2}
                        size="sm"
                        id="post-job-heading"
                        eyebrow="For employers"
                        title="Hiring? Post a job."
                        description="Tell us about the role. We review every submission before it goes live."
                        action={
                            <ButtonLink href="/post-job" size="lg">
                                Post a job
                            </ButtonLink>
                        }
                    />
                </CardContent>
            </Card>
        </section>
    );
}
