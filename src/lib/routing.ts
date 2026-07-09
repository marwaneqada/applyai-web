export function safeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  if (value.startsWith("/login") || value.startsWith("/register")) {
    return "/app";
  }

  return value;
}
