import type { Metadata } from "next";
import { connection } from "next/server";
import { getDashboardData } from "@/lib/services/dashboard";
import { SectionHeader } from "@/components/common/section-header";
import { DashboardStatCards } from "./_components/dashboard-stat-cards";
import { RecentApplications } from "./_components/recent-applications";

export const metadata: Metadata = {
    title: "Dashboard",
};

// Admin dashboard, served at admin.limitlezz.online (see proxy.ts).
export default async function AdminDashboard() {
    // Rendered per request, not at build time, so building the app never needs the database.
    await connection();
    const { stats, recentApplications } = await getDashboardData();

    return (
        <>
            <SectionHeader title="Admin Dashboard" description="Overview of the job board." />
            <DashboardStatCards stats={stats} />
            <RecentApplications applications={recentApplications} />
        </>
    );
}
