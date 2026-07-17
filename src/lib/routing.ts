import type { AccountType } from "@/lib/api";

export function accountHomePath(accountType: AccountType) {
  return accountType === "candidate" ? "/app" : "/account-unavailable";
}

export function safeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  if (value.startsWith("/login") || value.startsWith("/register")) {
    return "/app";
  }

  return value;
}
