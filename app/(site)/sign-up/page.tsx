import type { Metadata } from "next";
import { SectionHeader } from "@/components/common/section-header";
import { PageContainer } from "@/components/layout/container";
import { SignUpForm } from "./_components/sign-up-form";
import { signUpAction } from "./actions";

export const metadata: Metadata = {
    title: "Sign up",
};

export default function SignUp() {
    return (
        <PageContainer>
            <SectionHeader size="lg" eyebrow="For candidates" title="Create your account" description="Sign up to apply faster and keep track of your applications." />
            <SignUpForm action={signUpAction} />
        </PageContainer>
    );
}
