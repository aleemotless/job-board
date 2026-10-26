import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ButtonSize, ButtonVariant } from "@/types";

type ButtonLinkProps = {
    href: string;
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
};

// A next/link styled as a Button (never an <a> inside a <button>).
export function ButtonLink({ href, children, variant, size, className }: ButtonLinkProps) {
    return (
        <Button asChild variant={variant} size={size} className={className}>
            <Link href={href}>{children}</Link>
        </Button>
    );
}
