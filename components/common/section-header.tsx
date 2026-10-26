import type { ReactNode } from "react";

const titleSizes = {
    sm: "text-3xl sm:text-4xl",
    md: "text-4xl",
    lg: "text-4xl sm:text-5xl",
    xl: "text-4xl sm:text-6xl",
} as const;

type SectionHeaderProps = {
    title: ReactNode;
    // 1 = the page's <h1>, 2 = a section <h2>.
    level?: 1 | 2;
    size?: keyof typeof titleSizes;
    // Small caps label above the title, e.g. "For employers" or "3 open roles".
    eyebrow?: ReactNode;
    description?: ReactNode;
    // Rendered on the right, e.g. a button or a status badge.
    action?: ReactNode;
    // For aria-labelledby on the surrounding <section>.
    id?: string;
};

// Eyebrow, title, description and an optional action on the right. Used for page headers
// (level 1) and section headings (level 2).
export function SectionHeader({ title, level = 1, size = "md", eyebrow, description, action, id }: SectionHeaderProps) {
    const Heading = level === 1 ? "h1" : "h2";

    return (
        <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
                {eyebrow && <span className="label-caps text-muted-foreground">{eyebrow}</span>}
                <Heading id={id} className={titleSizes[size]}>
                    {title}
                </Heading>
                {description && <p className="text-lg text-muted-foreground">{description}</p>}
            </div>
            {action}
        </header>
    );
}
