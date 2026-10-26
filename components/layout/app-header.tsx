import { Suspense, type ReactNode } from "react";
import type { NavItem } from "@/types";
import { ActivePathProvider } from "./active-path.client";
import { BrandLogo } from "./brand-logo";
import { Container } from "./container";
import { NavLinks } from "./nav-links";

type AppHeaderProps = {
    items: NavItem[];
    // Right-hand side of the header, e.g. a call-to-action button.
    action?: ReactNode;
};

// Sticky top bar for the public site (the admin uses a sidebar, see app/(admin)/layout.tsx).
export function AppHeader({ items, action }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b-2 border-border bg-background text-foreground">
            <Container>
                <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <BrandLogo href="/" />
                        {/* Fallback renders the same links without an active state while the pathname resolves. */}
                        <Suspense fallback={<NavLinks items={items} />}>
                            <ActivePathProvider>
                                <NavLinks items={items} />
                            </ActivePathProvider>
                        </Suspense>
                    </div>
                    {action}
                </nav>
            </Container>
        </header>
    );
}
