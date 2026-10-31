import { hasJobs, insertMockData } from "@/lib/data/seed";

export { connectToDatabase } from "@/lib/data/mongo";

// Seeds only an empty database, so running it twice never duplicates data.
export async function seedDatabase() {
    if (await hasJobs()) return { ok: false, reason: "not-empty" } as const;
    return { ok: true, inserted: await insertMockData() } as const;
}
