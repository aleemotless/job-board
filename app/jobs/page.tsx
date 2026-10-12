import Link from "next/link";

export default function Jobs() {
    return (
        <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <h1 className="flex flex-col text-3xl font-bold mb-4">Job Listings</h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">Browse available job opportunities.</p>
                <ul className="mt-4 space-y-2">
                    <li className="p-4 border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <h2 className="text-xl font-bold">Frontend Developer</h2>
                        <p className="text-zinc-600 dark:text-zinc-400">Build and maintain user interfaces.</p>
                        <Link href="/jobs/1" className="text-blue-500 hover:underline">
                            View Details
                        </Link>
                    </li>
                    <li className="p-4 border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <h2 className="text-xl font-bold">Backend Developer</h2>
                        <p className="text-zinc-600 dark:text-zinc-400">Develop and manage server-side logic.</p>
                        <Link href="/jobs/2" className="text-blue-500 hover:underline">
                            View Details
                        </Link>
                    </li>
                    <li className="p-4 border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <h2 className="text-xl font-bold">Full Stack Developer</h2>
                        <p className="text-zinc-600 dark:text-zinc-400">Work on both frontend and backend development.</p>
                        <Link href="/jobs/3" className="text-blue-500 hover:underline">
                            View Details
                        </Link>
                    </li>
                </ul>
                <Link href="/" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Back to Home
                </Link>
            </main>
        </div>
    );
}