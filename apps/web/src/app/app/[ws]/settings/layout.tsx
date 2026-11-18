import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { SettingsNav } from "@/components/app/settings/settings-nav";

export default function SettingsLayout({ children }: LayoutProps<"/app/[ws]/settings">) {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-6 md:flex-row">
        <Suspense fallback={<div className="w-44 shrink-0" />}>
          <SettingsNav />
        </Suspense>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
