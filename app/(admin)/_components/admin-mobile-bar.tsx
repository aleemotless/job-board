import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ADMIN_BASE_PATH } from "@/lib/config";

// Small screens only: the sidebar collapses into a sheet, opened from here.
export function AdminMobileBar() {
    return (
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b-2 border-border bg-background px-4 py-3 md:hidden">
            <SidebarTrigger aria-label="Open navigation" />
            <BrandLogo href={ADMIN_BASE_PATH} badge={<Badge variant="secondary">Admin</Badge>} />
        </div>
    );
}
