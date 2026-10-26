import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "./button-link";

type BackLinkProps = { href: string; children: ReactNode };

export function BackLink({ href, children }: BackLinkProps) {
    return (
        <ButtonLink href={href} variant="link" className="self-start px-0 has-data-[icon=inline-start]:pl-0">
            <ArrowLeft data-icon="inline-start" />
            {children}
        </ButtonLink>
    );
}
