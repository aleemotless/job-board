import type { User } from "@/types";
import type { UserRecord } from "../models/user";

// Leaves out passwordHash, so it never leaves the data layer except through getUserCredentials.
export function toUser(user: UserRecord): User {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
    };
}
