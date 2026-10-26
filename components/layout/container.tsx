import { cva } from "class-variance-authority";
import { cn } from "cn";
import type { ReactNode } from "react";

const containerVariants = cva("mx-auto w-full px-4 sm:px-8", {
    variants: { width: { narrow: "max-w-3xl", wide: "max-w-5xl" } },
    defaultVariants: { width: "wide" },
});

type ContainerProps = { children: ReactNode; width?: "narrow" | "wide"; className?: string };

// `as="div"` when a <main> already wraps it (e.g. the admin SidebarInset).
type PageContainerProps = ContainerProps & { as?: "main" | "div" };

// Centered column shared by the header, footer and page bodies.
export function Container({ children, width, className }: ContainerProps) {
    return <div className={cn(containerVariants({ width }), className)}>{children}</div>;
}

// The page body: a Container with vertical rhythm, rendered as the page's <main> by default.
export function PageContainer({ children, width = "narrow", className, as: Element = "main" }: PageContainerProps) {
    return <Element className={cn(containerVariants({ width }), "flex flex-1 flex-col gap-8 py-12", className)}>{children}</Element>;
}
