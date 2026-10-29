import { cacheTag } from "next/cache";
import { isObjectIdOrHexString } from "mongoose";
import type { Job, JobInput, JobWithApplicationCount } from "@/types";
import { connectToDatabase } from "./mongo";
import { toJob, toJobWithApplicationCount } from "./mappers/job";
import { ApplicationModel } from "./models/application";
import { CvModel } from "./models/cv";
import { JobModel, type JobWithApplicationCountRecord } from "./models/job";
import { APPLICATIONS_TAG, JOBS_TAG } from "@/lib/config";

export async function getJobs(): Promise<Job[]> {
    "use cache";
    cacheTag(JOBS_TAG);
    await connectToDatabase();
    const jobs = await JobModel.find().sort({ createdAt: -1 }).lean();
    return jobs.map(toJob);
}

// Newest first, each with its number of applications, counted in the database.
export async function getJobsWithApplicationCounts(): Promise<JobWithApplicationCount[]> {
    "use cache";
    cacheTag(JOBS_TAG, APPLICATIONS_TAG);
    await connectToDatabase();
    const jobs = await JobModel.aggregate<JobWithApplicationCountRecord>([
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: ApplicationModel.collection.name,
                localField: "_id",
                foreignField: "jobId",
                pipeline: [{ $project: { _id: 1 } }],
                as: "applications",
            },
        },
        { $set: { applicationCount: { $size: "$applications" } } },
        { $unset: "applications" },
    ]);
    return jobs.map(toJobWithApplicationCount);
}

export async function getJob(id: string): Promise<Job | undefined> {
    "use cache";
    cacheTag(JOBS_TAG);
    if (!isObjectIdOrHexString(id)) return undefined;
    await connectToDatabase();
    const job = await JobModel.findById(id).lean();
    return job ? toJob(job) : undefined;
}

export async function createJob(input: JobInput): Promise<Job> {
    await connectToDatabase();
    const job = await JobModel.create(input);
    return toJob(job.toObject());
}

export async function updateJob(id: string, input: JobInput): Promise<Job | undefined> {
    if (!isObjectIdOrHexString(id)) return undefined;
    await connectToDatabase();
    const job = await JobModel.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true }).lean();
    return job ? toJob(job) : undefined;
}

// Also removes the job's applications and their CVs.
export async function deleteJob(id: string): Promise<void> {
    if (!isObjectIdOrHexString(id)) return;
    await connectToDatabase();
    const applicationIds = await ApplicationModel.find({ jobId: id }).distinct("_id");
    await CvModel.deleteMany({ applicationId: { $in: applicationIds } });
    await ApplicationModel.deleteMany({ jobId: id });
    await JobModel.findByIdAndDelete(id);
}
