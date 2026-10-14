import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Dashboard",
};

// Placeholder data until jobs come from a real data source.
const stats = [
    { label: "Open jobs", value: 3 },
    { label: "Applications", value: 0 },
    { label: "Companies", value: 1 },
];

const jobs = [
    { id: 1, title: "Frontend Developer", status: "Open", applications: 0 },
    { id: 2, title: "Backend Developer", status: "Open", applications: 0 },
    { id: 3, title: "Full Stack Developer", status: "Open", applications: 0 },
];

// Admin dashboard, served at admin.limitlezz.online (see proxy.ts).
export default function AdminDashboard() {
    return (
        <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex flex-1 w-full max-w-5xl flex-col gap-8 py-16 px-6 sm:px-16">
                <header>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">Overview of the job board.</p>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {stats.map((stat) => (
                        <div key={stat.label} className="p-4 border rounded bg-white dark:bg-zinc-900 dark:border-zinc-800">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</p>
                            <p className="text-3xl font-bold">{stat.value}</p>
                        </div>
                    ))}
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Jobs</h2>
                    <div className="overflow-x-auto border rounded bg-white dark:bg-zinc-900 dark:border-zinc-800">
                        <table className="w-full text-left">
                            <thead className="border-b text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                                <tr>
                                    <th className="p-4 font-medium">ID</th>
                                    <th className="p-4 font-medium">Title</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Applications</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job) => (
                                    <tr key={job.id} className="border-b last:border-0 dark:border-zinc-800">
                                        <td className="p-4">{job.id}</td>
                                        <td className="p-4">{job.title}</td>
                                        <td className="p-4">
                                            <span className="rounded bg-green-100 px-2 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">{job.applications}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
