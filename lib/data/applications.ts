import { cacheTag } from "next/cache";
import { isObjectIdOrHexString, Types, type PipelineStage } from "mongoose";
import type { Application, ApplicationInput, ApplicationStatus, ApplicationWithJob, StoredCv } from "@/types";
import { connectToDatabase } from "./mongo";
import { toApplication, toApplicationWithJob } from "./mappers/application";
import { ApplicationModel, type ApplicationWithJobRecord } from "./models/application";
import { deleteCv, getCv, putCv } from "./cv-storage";
import { JobModel } from "./models/job";
import { APPLICATIONS_TAG, JOBS_TAG } from "@/lib/config";

// Adds `job: { title }` to each application; left out if the job is gone.
const lookupJobTitle: PipelineStage[] = [
    {
        $lookup: {
            from: JobModel.collection.name,
            localField: "jobId",
            foreignField: "_id",
            pipeline: [{ $project: { title: 1 } }],
            as: "job",
        },
    },
    { $set: { job: { $first: "$job" } } },
];

export async function getApplications(): Promise<ApplicationWithJob[]> {
    "use cache";
    cacheTag(APPLICATIONS_TAG, JOBS_TAG); // job titles are embedded
    await connectToDatabase();
    const apps = await ApplicationModel.aggregate<ApplicationWithJobRecord>([{ $sort: { createdAt: -1 } }, ...lookupJobTitle]);
    return apps.map(toApplicationWithJob);
}

export async function getApplication(id: string): Promise<ApplicationWithJob | undefined> {
    "use cache";
    cacheTag(APPLICATIONS_TAG, JOBS_TAG); // job titles are embedded
    if (!isObjectIdOrHexString(id)) return undefined;
    await connectToDatabase();
    // aggregate() doesn't cast like find(), so the id must already be an ObjectId.
    const [app] = await ApplicationModel.aggregate<ApplicationWithJobRecord>([
        { $match: { _id: new Types.ObjectId(id) } },
        ...lookupJobTitle,
    ]);
    return app ? toApplicationWithJob(app) : undefined;
}

// Not cached: returns file bytes from S3, read per request by the CV download route.
export async function getApplicationCv(id: string): Promise<StoredCv | undefined> {
    if (!isObjectIdOrHexString(id)) return undefined;
    await connectToDatabase();
    const app = await ApplicationModel.findById(id, { cv: 1 }).lean();
    if (!app?.cv) return undefined;
    const data = await getCv(id);
    if (!data) return undefined;
    return { fileName: app.cv.fileName, contentType: app.cv.contentType, size: app.cv.size, data };
}

export async function createApplication(jobId: string, input: ApplicationInput, cv: StoredCv): Promise<Application> {
    await connectToDatabase();
    const { data, ...meta } = cv;
    // Upload first, so an application is never saved without its CV. If saving fails, the object is
    // left behind but unreachable.
    const _id = new Types.ObjectId();
    await putCv(_id.toHexString(), data, meta.contentType);
    const app = await ApplicationModel.create({ ...input, _id, jobId, cv: meta, status: "pending" });
    return toApplication(app.toObject());
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application | undefined> {
    if (!isObjectIdOrHexString(id)) return undefined;
    await connectToDatabase();
    const app = await ApplicationModel.findByIdAndUpdate(id, { status }, { returnDocument: "after", runValidators: true }).lean();
    return app ? toApplication(app) : undefined;
}

export async function deleteApplication(id: string): Promise<void> {
    if (!isObjectIdOrHexString(id)) return;
    await connectToDatabase();
    await deleteCv(id);
    await ApplicationModel.findByIdAndDelete(id);
}
