import { cacheLife } from "next/cache";
import { ButtonLink } from "@/components/common/button-link";
import { FOOTER_LINKS, SITE } from "@/lib/config";
import { BrandLogo } from "./brand-logo";
import { Container } from "./container";

// Cached so the copyright year (new Date()) can be prerendered under Cache Components.
export async function SiteFooter() {
    "use cache";
    cacheLife("days");
    const year = new Date().getFullYear();

    return (
        <footer className="border-t-2 border-border bg-primary text-primary-foreground">
            <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2">
                    <BrandLogo href="/" tone="inverted" />
                    <p className="text-sm opacity-80">{SITE.tagline}</p>
                </div>
                <nav aria-label="Footer">
                    <ul className="flex flex-wrap gap-x-6 gap-y-2">
                        {FOOTER_LINKS.map((link) => (
                            <li key={link.href}>
                                <ButtonLink href={link.href} variant="link" className="label-caps px-0 text-primary-foreground">
                                    {link.label}
                                </ButtonLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <p className="label-caps opacity-80">© {year} {SITE.name}</p>
            </Container>
        </footer>
    );
}
