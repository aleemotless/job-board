// Feature props shared by several components. A props type used by one component lives in that component's file.
import type { ApplicationWithJob } from "./application";

// For async loaders that await a dynamic route's params inside <Suspense>.
export type IdParamsProps = { params: Promise<{ id: string }> };

// ApplicationsTable and RecentApplications.
export type ApplicationListProps = { applications: ApplicationWithJob[] };
