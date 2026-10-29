import { model, Schema } from "mongoose";
import { CV_TYPES } from "@/lib/config";

// A CV file's bytes, one per application. Read only by the CV download route.
// MAX_CV_BYTES (5 MB) stays well under MongoDB's 16 MB document limit, so GridFS isn't needed.
const cvSchema = new Schema({
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
    fileName: { type: String, required: true },
    contentType: { type: String, enum: Object.values<string>(CV_TYPES), required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
});

// overwriteModels: dev-server hot reloads re-run this file with a new schema.
export const CvModel = model("Cv", cvSchema, undefined, { overwriteModels: true });
