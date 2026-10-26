import { cacheTag } from "next/cache";
import type { Application, ApplicationInput, ApplicationStatus, ApplicationWithJob, StoredCv } from "@/types";
import { newId, store } from "./store";
import { APPLICATIONS_TAG, JOBS_TAG } from "@/lib/config";

function withJob(app: Application): ApplicationWithJob {
    const job = store.jobs.find((j) => j.id === app.jobId);
    return { ...app, job: job ? { id: job.id, title: job.title } : null };
}

export async function getApplications(): Promise<ApplicationWithJob[]> {
    "use cache";
    cacheTag(APPLICATIONS_TAG, JOBS_TAG); // job titles are embedded
    return [...store.applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(withJob);
}

export async function getApplication(id: string): Promise<ApplicationWithJob | undefined> {
    "use cache";
    cacheTag(APPLICATIONS_TAG, JOBS_TAG); // job titles are embedded
    const app = store.applications.find((a) => a.id === id);
    return app && withJob(app);
}

// Not cached: returns file bytes, read per request by the CV download route.
export async function getApplicationCv(id: string): Promise<StoredCv | undefined> {
    return store.cvs[id];
}

export async function createApplication(jobId: string, input: ApplicationInput, cv: StoredCv): Promise<Application> {
    const { data, ...meta } = cv;
    const application: Application = { ...input, id: newId(), jobId, cv: meta, status: "pending", createdAt: new Date().toISOString() };
    store.applications.push(application);
    store.cvs[application.id] = { ...meta, data };
    return application;
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application | undefined> {
    const app = store.applications.find((a) => a.id === id);
    if (app) app.status = status;
    return app;
}

export async function deleteApplication(id: string): Promise<void> {
    store.applications = store.applications.filter((a) => a.id !== id);
    delete store.cvs[id];
}
