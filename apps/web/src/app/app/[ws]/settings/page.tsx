import { redirect } from "next/navigation";

export default async function SettingsIndex({ params }: PageProps<"/app/[ws]/settings">) {
  const { ws } = await params;
  redirect(`/app/${ws}/settings/general`);
}
