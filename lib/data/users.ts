import { mongo } from "mongoose";
import type { User, UserRole } from "@/types";
import { connectToDatabase } from "./mongo";
import { toUser } from "./mappers/user";
import { UserModel } from "./models/user";

// Not cached: read per sign-in, and the result includes the password hash.
export async function getUserCredentials(email: string): Promise<{ user: User; passwordHash: string } | undefined> {
    await connectToDatabase();
    const user = await UserModel.findOne({ email }).lean();
    return user ? { user: toUser(user), passwordHash: user.passwordHash } : undefined;
}

// Undefined if the email is already registered (the unique index rejects it, so two sign-ups can't race).
export async function createUser(input: { name: string; email: string; passwordHash: string; role: UserRole }): Promise<User | undefined> {
    await connectToDatabase();
    try {
        const user = await UserModel.create(input);
        return toUser(user.toObject());
    } catch (error) {
        if (error instanceof mongo.MongoServerError && error.code === 11000) return undefined;
        throw error;
    }
}
