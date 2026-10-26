import { Briefcase, FileText, LayoutDashboard, Users } from "lucide-react";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import type { NavIcon, NavItem } from "@/types";
import { SidebarNavLink } from "./sidebar-nav-link.client";

const icons: Record<NavIcon, typeof LayoutDashboard> = {
    dashboard: LayoutDashboard,
    jobs: Briefcase,
    applications: FileText,
    candidates: Users,
};

type SidebarNavProps = { items: NavItem[] };

// Server Component: the menu, icons and labels render on the server; each link is a client island.
export function SidebarNav({ items }: SidebarNavProps) {
    return (
        <SidebarMenu className="gap-2">
            {items.map((item) => {
                const Icon = item.icon && icons[item.icon];
                return (
                    <SidebarMenuItem key={item.href}>
                        <SidebarNavLink item={item}>
                            {Icon && <Icon aria-hidden />}
                            <span>{item.label}</span>
                        </SidebarNavLink>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}
