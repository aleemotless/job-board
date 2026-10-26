import { cacheTag } from "next/cache";
import type { ApplicationWithJob, Candidate } from "@/types";
import { getApplications } from "@/lib/data/applications";
import { APPLICATIONS_TAG, CANDIDATE_STAGE_ORDER, JOBS_TAG } from "@/lib/config";

// One candidate per email, ordered by their latest application.
export async function getCandidates(): Promise<Candidate[]> {
    "use cache";
    cacheTag(APPLICATIONS_TAG, JOBS_TAG); // job titles are embedded
    const applications = await getApplications(); // newest first

    const byEmail = new Map<string, ApplicationWithJob[]>();
    for (const app of applications) {
        const id = app.email.toLowerCase();
        byEmail.set(id, [...(byEmail.get(id) ?? []), app]);
    }

    return [...byEmail].map(([id, apps]) => {
        const latest = apps[0];
        const withCv = apps.find((app) => app.cv);
        return {
            id,
            name: latest.name,
            email: latest.email,
            applications: apps.map(({ id, status, job }) => ({ id, status, job })),
            stage: CANDIDATE_STAGE_ORDER.find((stage) => apps.some((app) => app.status === stage)) ?? latest.status,
            firstAppliedAt: apps[apps.length - 1].createdAt,
            lastAppliedAt: latest.createdAt,
            latestCv: withCv?.cv ? { ...withCv.cv, applicationId: withCv.id } : null,
        };
    });
}
