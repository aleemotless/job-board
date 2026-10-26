import { FEATURED_JOBS_COUNT } from "@/lib/config";
import { getOpenJobs } from "@/lib/services/jobs";
import { HomeContent } from "./_components/home-content";

export default async function Home() {
  const featuredJobs = await getOpenJobs(FEATURED_JOBS_COUNT);

  return <HomeContent featuredJobs={featuredJobs} />;
}
