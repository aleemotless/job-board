import { ButtonLink } from "@/components/common/button-link";
import { AppHeader } from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SITE_NAV } from "@/lib/config";

// Chrome for the user-facing site (served at joblezz.limitlezz.online, see proxy.ts).
export default function SiteLayout({ children }: LayoutProps<"/">) {
    return (
        <>
            <AppHeader
                items={SITE_NAV}
                action={
                    <ButtonLink href="/jobs" className="hidden sm:inline-flex">
                        Find a job
                    </ButtonLink>
                }
            />
            {children}
            <SiteFooter />
        </>
    );
}
