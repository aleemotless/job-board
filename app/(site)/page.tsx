import { connection } from "next/server";
import { FEATURED_JOBS_COUNT } from "@/lib/config";
import { getOpenJobs } from "@/lib/services/jobs";
import { HomeContent } from "./_components/home-content";

export default async function Home() {
  // Rendered per request, not at build time, so building the app never needs the database.
  await connection();
  const featuredJobs = await getOpenJobs(FEATURED_JOBS_COUNT);

  return <HomeContent featuredJobs={featuredJobs} />;
}
