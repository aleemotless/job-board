import type { ReactNode } from "react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const titleSizes = { 1: "text-4xl", 2: "text-2xl" } as const;

type MessageCardProps = {
    title: string;
    description: ReactNode;
    icon?: ReactNode;
    actions?: ReactNode;
    level?: 1 | 2;
    live?: boolean;
};

// Confirmation / result message, e.g. "Application sent".
export function MessageCard({ title, description, icon, actions, level = 2, live = false }: MessageCardProps) {
    const Heading = level === 1 ? "h1" : "h2";

    return (
        <Card role={live ? "status" : undefined}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {icon}
                    <Heading className={titleSizes[level]}>{title}</Heading>
                </CardTitle>
                <CardDescription className="text-base">{description}</CardDescription>
            </CardHeader>
            {actions && <CardFooter className="gap-3">{actions}</CardFooter>}
        </Card>
    );
}
