"use client";

import Link from "next/link";
import { cn } from "cn";
import { NavigationMenuLink, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import type { NavItem } from "@/types";
import { useIsNavItemActive } from "./active-path.client";

type NavLinkProps = { item: NavItem };

// The only client part of the nav: reads the current path to mark itself active.
export function NavLink({ item }: NavLinkProps) {
    const active = useIsNavItemActive(item);

    return (
        <NavigationMenuLink
            asChild
            active={active}
            className={cn(
                navigationMenuTriggerStyle(),
                "label-caps border-2 border-transparent hover:border-border hover:bg-card",
                "data-active:border-border data-active:bg-accent data-active:text-accent-foreground data-active:shadow-brutal-sm data-active:hover:bg-accent",
            )}
        >
            <Link href={item.href}>{item.label}</Link>
        </NavigationMenuLink>
    );
}
