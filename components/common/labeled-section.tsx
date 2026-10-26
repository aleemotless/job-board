import type { ReactNode } from "react";

type LabeledSectionProps = { title: string; children: ReactNode };

// A block of content under a small caps label, e.g. "Salary" or "Cover letter".
export function LabeledSection({ title, children }: LabeledSectionProps) {
    return (
        <section className="flex flex-col gap-3">
            <h2 className="label-caps text-muted-foreground">{title}</h2>
            {children}
        </section>
    );
}
