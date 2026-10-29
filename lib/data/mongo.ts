// MongoDB connection via mongoose. Only lib/data/* uses it; handlers reach it
// through lib/services/database.ts.

import mongoose from "mongoose";
import { MONGODB_MAX_POOL_SIZE } from "@/lib/config";

class MongoConnection {
    private connection: Promise<void> | null = null;

    // Opens one connection pool per server process (up to MONGODB_MAX_POOL_SIZE sockets,
    // shared by concurrent queries); later calls reuse that pool.
    // A failed attempt is forgotten so the next call retries.
    connect(): Promise<void> {
        this.connection ??= this.open().catch((error: unknown) => {
            this.connection = null;
            throw error;
        });
        return this.connection;
    }

    private async open(): Promise<void> {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is not set");
        await mongoose.connect(uri, { maxPoolSize: MONGODB_MAX_POOL_SIZE });
    }
}

// Kept on globalThis so dev-server hot reloads don't open a new pool each time.
const globalMongo = globalThis as typeof globalThis & { __mongo?: MongoConnection };
const mongo = (globalMongo.__mongo ??= new MongoConnection());

export function connectToDatabase(): Promise<void> {
    return mongo.connect();
}
