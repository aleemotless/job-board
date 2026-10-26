import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type NoticeProps = {
    children: ReactNode;
    // "card" stands alone in a page; "inline" sits inside another surface.
    variant?: "inline" | "card";
    // Announce to screen readers (loading messages).
    live?: boolean;
};

// Muted one-line message: empty states and Suspense loading fallbacks.
export function Notice({ children, variant = "inline", live = false }: NoticeProps) {
    const text = (
        <p role={live ? "status" : undefined} className="text-muted-foreground">
            {children}
        </p>
    );
    if (variant === "inline") return text;

    return (
        <Card>
            <CardContent>{text}</CardContent>
        </Card>
    );
}
