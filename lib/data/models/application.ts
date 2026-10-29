import { model, Schema, type InferSchemaType, type Types } from "mongoose";
import { APPLICATION_STATUSES, CV_TYPES } from "@/lib/config";

// CV metadata only; the bytes live in the `cvs` collection (see cv.ts) so application reads never carry file data.
const cvFileSchema = new Schema(
    {
        fileName: { type: String, required: true },
        contentType: { type: String, enum: Object.values<string>(CV_TYPES), required: true },
        size: { type: Number, required: true },
    },
    { _id: false },
);

// Stored shape of an Application (lib/schemas/application.ts). `_id` maps to `id`, `createdAt` is a Date.
const applicationSchema = new Schema(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        coverLetter: { type: String, default: "" },
        cv: { type: cvFileSchema, default: null },
        status: { type: String, enum: APPLICATION_STATUSES, default: "pending" },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

// Admin lists are newest first.
applicationSchema.index({ createdAt: -1 });

// A stored application as read with .lean().
export type ApplicationRecord = InferSchemaType<typeof applicationSchema> & { _id: Types.ObjectId };

// An application from the job-title $lookup in applications.ts; `job` is missing if the job is gone.
export type ApplicationWithJobRecord = ApplicationRecord & { job?: { title: string } };

// overwriteModels: dev-server hot reloads re-run this file with a new schema.
export const ApplicationModel = model("Application", applicationSchema, undefined, { overwriteModels: true });
