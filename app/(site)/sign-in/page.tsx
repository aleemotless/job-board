import type { Metadata } from "next";
import { SectionHeader } from "@/components/common/section-header";
import { PageContainer } from "@/components/layout/container";
import { SignInForm } from "./_components/sign-in-form";
import { signInAction } from "./actions";

export const metadata: Metadata = {
    title: "Sign in",
};

export default function SignIn() {
    return (
        <PageContainer>
            <SectionHeader size="lg" title="Sign in" />
            <SignInForm action={signInAction} />
        </PageContainer>
    );
}
