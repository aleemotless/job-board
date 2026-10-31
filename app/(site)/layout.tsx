import { AppHeader } from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SITE_NAV } from "@/lib/config";
import { SiteHeaderActions } from "./_components/site-header-actions";

// Chrome for the user-facing site (served at joblezz.limitlezz.online, see proxy.ts).
export default function SiteLayout({ children }: LayoutProps<"/">) {
    return (
        <>
            <AppHeader items={SITE_NAV} action={<SiteHeaderActions />} />
            {children}
            <SiteFooter />
        </>
    );
}
