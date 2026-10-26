import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

type DashboardStatCardsProps = { stats: DashboardStats };

export function DashboardStatCards({ stats }: DashboardStatCardsProps) {
    const cards = [
        { label: "Open jobs", value: stats.openJobs, href: "/admin/jobs" },
        { label: "Applications", value: stats.applications, href: "/admin/applications" },
        { label: "Pending review", value: stats.pendingReview, href: "/admin/applications" },
    ];

    return (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {cards.map((card) => (
                <Link key={card.label} href={card.href}>
                    <Card className="brutal-hover">
                        <CardHeader>
                            <CardDescription className="label-caps">{card.label}</CardDescription>
                            <CardTitle className="font-display text-5xl">{card.value}</CardTitle>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </section>
    );
}
