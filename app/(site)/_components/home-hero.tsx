import { ButtonLink } from "@/components/common/button-link";
import { SectionHeader } from "@/components/common/section-header";
import { SITE } from "@/lib/config";

export function HomeHero() {
    return (
        <section className="grid-paper flex justify-center bg-background px-4 py-16 text-foreground">
            <div className="brutal-box flex w-full max-w-3xl flex-col items-start gap-6 px-6 py-16 sm:px-16">
                <SectionHeader size="xl" eyebrow={SITE.name} title="Welcome to the Job Board" description="Find your next opportunity here." />
                <ButtonLink href="/jobs" size="lg">
                    Browse Jobs
                </ButtonLink>
            </div>
        </section>
    );
}
