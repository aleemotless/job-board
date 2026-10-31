import { model, Schema, type InferSchemaType, type Types } from "mongoose";
import { USER_ROLES } from "@/lib/config";

// Stored shape of a User (lib/schemas/user.ts) plus its password hash. `_id` maps to `id`, `createdAt` is a Date.
const userSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: USER_ROLES, default: "candidate" },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

// A stored user as read with .lean().
export type UserRecord = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

// overwriteModels: dev-server hot reloads re-run this file with a new schema.
export const UserModel = model("User", userSchema, undefined, { overwriteModels: true });
