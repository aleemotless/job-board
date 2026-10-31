import { model, Schema, type InferSchemaType, type Types } from "mongoose";
import { JOB_STATUSES } from "@/lib/config";

// Stored shape of a Job (lib/schemas/job.ts). `_id` maps to `id`, `createdAt` is a Date.
const jobSchema = new Schema(
    {
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String, required: true },
        description: { type: String, required: true },
        // One requirement per line.
        requirements: { type: String, required: true },
        salary: { type: String, required: true },
        status: { type: String, enum: JOB_STATUSES, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

// Newest open jobs for the public site.
jobSchema.index({ status: 1, createdAt: -1 });

// A stored job as read with .lean().
export type JobRecord = InferSchemaType<typeof jobSchema> & { _id: Types.ObjectId };

// A job from the application-count aggregation in jobs.ts.
export type JobWithApplicationCountRecord = JobRecord & { applicationCount: number };

// overwriteModels: dev-server hot reloads re-run this file with a new schema.
export const JobModel = model("Job", jobSchema, undefined, { overwriteModels: true });
