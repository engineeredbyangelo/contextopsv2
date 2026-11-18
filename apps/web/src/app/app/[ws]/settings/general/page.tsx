import { GeneralSettingsForm } from "@/components/app/settings/general-form";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "General settings" };

export default async function GeneralSettingsPage({
  params,
}: PageProps<"/app/[ws]/settings/general">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const s = workspace.settings as Record<string, unknown>;
  return (
    <GeneralSettingsForm
      canEdit={workspace.role === "owner" || workspace.role === "admin"}
      defaults={{
        name: workspace.name,
        slug: workspace.slug,
        audience: s.audience === "clients" ? "clients" : "company",
        requirePublishApproval: s.requirePublishApproval === true,
        rolloutsByEditors:
          s.rolloutsByEditors === "always" || s.rolloutsByEditors === "with_approval"
            ? s.rolloutsByEditors
            : "never",
      }}
    />
  );
}
