import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { safeRedirectPath } from "@/lib/routing";

export const metadata: Metadata = {
  title: "Login | ApplyAI",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirectValue = Array.isArray(params.redirect)
    ? params.redirect[0]
    : params.redirect;

  return <AuthPage mode="login" redirectTo={safeRedirectPath(redirectValue)} />;
}
