import { ActionButton } from "@/components/common/action-button";
import { ButtonLink } from "@/components/common/button-link";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/config";
import { signOutAction } from "../actions";

type AccountNavProps = {
    // Undefined when signed out.
    userName?: string;
};

// Sign in / sign up links, or the signed-in user's name and a sign-out button.
export function AccountNav({ userName }: AccountNavProps) {
    if (userName === undefined) {
        return (
            <div className="flex items-center gap-2">
                <ButtonLink href={SIGN_IN_PATH} variant="outline">
                    Sign in
                </ButtonLink>
                <ButtonLink href={SIGN_UP_PATH}>Sign up</ButtonLink>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <span className="label-caps">{userName}</span>
            <ActionButton action={signOutAction} pendingLabel="Signing out..." variant="outline">
                Sign out
            </ActionButton>
        </div>
    );
}
