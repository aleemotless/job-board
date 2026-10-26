import type { ReactNode } from "react";
import Link from "next/link";
import { SITE } from "@/lib/config";

const dotTones = { default: "text-ring", inverted: "text-secondary" } as const;

type BrandLogoProps = { href: string; tone?: keyof typeof dotTones; badge?: ReactNode };

export function BrandLogo({ href, tone = "default", badge }: BrandLogoProps) {
    return (
        <Link href={href} className="flex items-center gap-2 font-display text-2xl tracking-tight">
            <span>
                {SITE.name}
                <span className={dotTones[tone]}>.</span>
            </span>
            {badge}
        </Link>
    );
}
