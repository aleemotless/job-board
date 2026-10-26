import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar";
import { ActivePathProvider } from "@/components/layout/active-path.client";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ADMIN_BASE_PATH, ADMIN_NAV } from "@/lib/config";

export function AdminSidebar() {
    return (
        <Sidebar className="border-r-2 border-sidebar-border">
            <SidebarHeader className="border-b-2 border-sidebar-border px-4 py-4">
                <BrandLogo href={ADMIN_BASE_PATH} badge={<Badge variant="secondary">Admin</Badge>} />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup className="px-3 py-4">
                    <SidebarGroupLabel className="label-caps">Manage</SidebarGroupLabel>
                    <SidebarGroupContent>
                        {/* Fallback renders the same links without an active state while the pathname resolves. */}
                        <Suspense fallback={<SidebarNav items={ADMIN_NAV} />}>
                            <ActivePathProvider basePath={ADMIN_BASE_PATH}>
                                <SidebarNav items={ADMIN_NAV} />
                            </ActivePathProvider>
                        </Suspense>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
