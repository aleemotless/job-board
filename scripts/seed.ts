// Inserts the mock data into the database at MONGODB_URI: `npm run seed` (reads .env).

import { connectToDatabase, seedDatabase } from "@/lib/services/database";

async function main() {
    await connectToDatabase();
    const result = await seedDatabase();
    if (result.ok) {
        const { jobs, applications, cvs } = result.inserted;
        console.log(`Seeded ${jobs} jobs, ${applications} applications and ${cvs} CVs.`);
    } else {
        console.log("Database already has jobs; nothing inserted.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
        console.error(error);
        process.exit(1);
    });
