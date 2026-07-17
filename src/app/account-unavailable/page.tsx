import type { Metadata } from "next";
import { AccountUnavailableView } from "@/components/auth/account-unavailable-view";

export const metadata: Metadata = {
  title: "Account unavailable | ApplyAI",
};

export default function AccountUnavailablePage() {
  return <AccountUnavailableView />;
}
