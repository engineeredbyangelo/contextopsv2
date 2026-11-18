import { Suspense } from "react";
import { Search } from "lucide-react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { CommandPalette } from "@/components/app/command-palette";
import { SearchButton } from "@/components/app/search-button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser, getSearchIndex, listMyWorkspaces } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

/**
 * Workspace shell. With Cache Components, the [ws] param is request data, so everything
 * that reads it sits in Suspense and the frame around it prerenders as a static shell.
 */
export default function WorkspaceLayout({ children, params }: LayoutProps<"/app/[ws]">) {
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarFallback />}>
        <WorkspaceChrome params={params} />
      </Suspense>
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <div className="flex-1" />
          <SearchButton>
            <Search /> <span className="hidden sm:inline">Search</span>
          </SearchButton>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function WorkspaceChrome({ params }: { params: LayoutProps<"/app/[ws]">["params"] }) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const [user, workspaces, index] = await Promise.all([
    getCurrentUser(),
    listMyWorkspaces(),
    getSearchIndex(workspace.id),
  ]);
  return (
    <>
      <AppSidebar workspace={workspace} workspaces={workspaces} user={user} />
      <CommandPalette workspace={workspace} workspaces={workspaces} index={index} />
    </>
  );
}

function SidebarFallback() {
  return (
    <div className="bg-sidebar hidden w-(--sidebar-width) shrink-0 flex-col gap-3 border-r p-3 md:flex">
      <Skeleton className="h-10" />
      <Skeleton className="h-8" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-7" />
      ))}
    </div>
  );
}
