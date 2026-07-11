import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { TourProvider } from "@/components/app/tour/tour-context";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return (
    <TourProvider>
      <AppShell>{children}</AppShell>
    </TourProvider>
  );
}
