"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types";

type ActivePathProviderProps = {
    children: ReactNode;
    // Prefix the routes live under when the host may serve them without it, e.g. "/admin"
    // (admin.limitlezz.online/jobs is app/(admin)/admin/jobs, see proxy.ts).
    basePath?: string;
};

// undefined = pathname not known yet (e.g. the Suspense fallback), so nothing is marked active.
const ActivePathContext = createContext<string | undefined>(undefined);

// The browser path can be either form on a rewritten host ("/jobs" or "/admin/jobs"),
// so normalize to the prefixed form that nav hrefs use.
function withBasePath(pathname: string, basePath?: string): string {
    if (!basePath || pathname === basePath || pathname.startsWith(`${basePath}/`)) return pathname;
    return pathname === "/" ? basePath : `${basePath}${pathname}`;
}

// usePathname suspends on routes with unknown dynamic params (e.g. /jobs/[id]) under cacheComponents,
// so render this inside <Suspense>, with the same children (minus the provider) as the fallback.
export function ActivePathProvider({ children, basePath }: ActivePathProviderProps) {
    return <ActivePathContext value={withBasePath(usePathname(), basePath)}>{children}</ActivePathContext>;
}

// True when `item` matches the current path (exact for index routes like "/" or "/admin").
// False while the path is unknown (Suspense fallback / outside a provider).
export function useIsNavItemActive({ href, exact }: NavItem): boolean {
    const pathname = useContext(ActivePathContext);
    if (pathname === undefined) return false;
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
