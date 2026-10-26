import { Container } from "@/components/layout/container";
import type { Job } from "@/types";
import { FeaturedJobs } from "./featured-jobs";
import { HomeHero } from "./home-hero";
import { PostJobCta } from "./post-job-cta";

type HomeContentProps = { featuredJobs: Job[] };

// Full-bleed hero, then the centered sections.
export function HomeContent({ featuredJobs }: HomeContentProps) {
    return (
        <main className="flex flex-1 flex-col">
            <HomeHero />
            <Container className="flex flex-col gap-16 py-16">
                <FeaturedJobs jobs={featuredJobs} />
                <PostJobCta />
            </Container>
        </main>
    );
}
