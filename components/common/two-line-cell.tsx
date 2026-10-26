import type { ReactNode } from "react";

type TwoLineCellProps = { primary: ReactNode; secondary: ReactNode };

// Primary text over a muted secondary line, e.g. job title over company.
export function TwoLineCell({ primary, secondary }: TwoLineCellProps) {
    return (
        <>
            <p className="font-medium">{primary}</p>
            <p className="text-muted-foreground">{secondary}</p>
        </>
    );
}
