// In-memory mock database. Replace this module (and keep the functions in
// jobs.ts / applications.ts) once a real database is in place.
// Data resets on every restart or deploy.

import type { MockStore } from "@/types";

function seed(): MockStore {
    const createdAt = new Date("2026-10-01T09:00:00Z").toISOString();
    return {
        jobs: [
            { id: "1", title: "Frontend Developer", company: "Limitlezz", location: "Remote", description: "Build and maintain user interfaces.", requirements: "3+ years with React and TypeScript\nSolid CSS and accessibility skills\nExperience with Next.js", salary: "EGP 40,000 – 55,000 / month", status: "open", createdAt },
            { id: "2", title: "Backend Developer", company: "Limitlezz", location: "Remote", description: "Develop and manage server-side logic.", requirements: "3+ years with Node.js\nStrong PostgreSQL knowledge\nREST API design experience", salary: "EGP 45,000 – 60,000 / month", status: "open", createdAt },
            { id: "3", title: "Full Stack Developer", company: "Limitlezz", location: "Cairo", description: "Work on both frontend and backend development.", requirements: "Experience across React and Node.js\nComfortable with SQL databases\nOwnership from design to deploy", salary: "EGP 50,000 – 70,000 / month", status: "open", createdAt },
        ],
        applications: [
            { id: "1", jobId: "1", name: "Sara Ali", email: "sara@example.com", coverLetter: "I have 3 years of React experience.", cv: null, status: "pending", createdAt },
            { id: "2", jobId: "1", name: "Omar Hassan", email: "omar@example.com", coverLetter: "I love building accessible UIs.", cv: null, status: "reviewing", createdAt },
            { id: "3", jobId: "2", name: "Mona Adel", email: "mona@example.com", coverLetter: "Node.js and PostgreSQL are my daily tools.", cv: null, status: "pending", createdAt },
        ],
        cvs: {},
    };
}

// Kept on globalThis so dev-server hot reloads don't wipe it.
const globalStore = globalThis as typeof globalThis & { __mockStore?: MockStore };
export const store = (globalStore.__mockStore ??= seed());

export function newId() {
    return crypto.randomUUID();
}
