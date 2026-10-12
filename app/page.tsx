import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="flex flex-col text-3xl font-bold mb-4">Welcome to the Job Board</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">Find your next opportunity here.</p>
        <Link href="/jobs" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Browse Jobs
        </Link>
      </main>
    </div>
  );
}
