import { Types } from "mongoose";
import { ApplicationModel } from "./models/application";
import { putCv } from "./cv-storage";
import { JobModel } from "./models/job";
import { seed } from "./store";

export async function hasJobs(): Promise<boolean> {
    return (await JobModel.exists({})) !== null;
}

// Inserts the mock data from store.ts. Mock ids ("1", "2", …) become new ObjectIds
// and the references between jobs, applications and CVs are remapped to them.
export async function insertMockData(): Promise<{ jobs: number; applications: number; cvs: number }> {
    const { jobs, applications, cvs } = seed();
    const jobIds = new Map(jobs.map((job) => [job.id, new Types.ObjectId()]));
    const applicationIds = new Map(applications.map((app) => [app.id, new Types.ObjectId()]));

    await JobModel.insertMany(
        jobs.map(({ id, createdAt, ...job }) => ({ ...job, _id: jobIds.get(id), createdAt: new Date(createdAt) })),
    );
    await ApplicationModel.insertMany(
        applications.map(({ id, jobId, createdAt, ...app }) => ({
            ...app,
            _id: applicationIds.get(id),
            jobId: jobIds.get(jobId),
            createdAt: new Date(createdAt),
        })),
    );
    for (const [applicationId, cv] of Object.entries(cvs)) {
        await putCv(applicationIds.get(applicationId)!.toHexString(), cv.data, cv.contentType);
    }

    return { jobs: jobs.length, applications: applications.length, cvs: Object.keys(cvs).length };
}
