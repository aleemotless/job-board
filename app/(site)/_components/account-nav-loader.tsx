import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { AccountNav } from "./account-nav";

// Renders per request inside <Suspense> (see SiteHeaderActions). `connection()` comes first because
// auth() generates random values before reading the session cookie, which prerendering rejects.
export async function AccountNavLoader() {
    await connection();
    const session = await auth();
    return <AccountNav userName={session?.user.name ?? undefined} />;
}
