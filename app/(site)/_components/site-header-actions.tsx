import { Suspense } from "react";
import { ButtonLink } from "@/components/common/button-link";
import { AccountNavLoader } from "./account-nav-loader";

// Right-hand side of the site header. The account area depends on the session, so it streams in
// after the prerendered shell (nothing is shown until then, to avoid flashing the wrong state).
export function SiteHeaderActions() {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/jobs" variant="outline" className="hidden sm:inline-flex">
                Find a job
            </ButtonLink>
            <Suspense fallback={null}>
                <AccountNavLoader />
            </Suspense>
        </div>
    );
}
