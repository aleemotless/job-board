"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import type { NavItem } from "@/types";
import { useIsNavItemActive } from "./active-path.client";

// `children` is the server-rendered icon + label.
type SidebarNavLinkProps = { item: NavItem; children: ReactNode };

// The only client part of the sidebar nav: marks itself active from the current path, and
// closes the slide-out sheet on small screens once a link is chosen.
export function SidebarNavLink({ item, children }: SidebarNavLinkProps) {
    const active = useIsNavItemActive(item);
    const { setOpenMobile } = useSidebar();

    return (
        <SidebarMenuButton
            asChild
            isActive={active}
            className="label-caps h-10 border-2 border-transparent data-[active=true]:border-border data-[active=true]:shadow-brutal-sm"
        >
            <Link href={item.href} aria-current={active ? "page" : undefined} onClick={() => setOpenMobile(false)}>
                {children}
            </Link>
        </SidebarMenuButton>
    );
}
