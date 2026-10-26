import type { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageContainer } from "@/components/layout/container";
import { SITE } from "@/lib/config";
import { AdminMobileBar } from "./_components/admin-mobile-bar";
import { AdminSidebar } from "./_components/admin-sidebar";

export const metadata: Metadata = {
    title: { template: `%s · ${SITE.name} Admin`, default: `${SITE.name} Admin` },
    robots: { index: false, follow: false },
};

// Chrome for every admin page (served at admin.limitlezz.online, see proxy.ts):
// a left sidebar on desktop, a top bar + slide-out sheet on small screens.
export default function AdminLayout({ children }: LayoutProps<"/">) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <AdminMobileBar />
                <PageContainer as="div" width="wide">
                    {children}
                </PageContainer>
            </SidebarInset>
        </SidebarProvider>
    );
}
