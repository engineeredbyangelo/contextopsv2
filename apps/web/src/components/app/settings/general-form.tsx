"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PendingButton } from "@/components/app/pending-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { workspaceSettingsSchema, type WorkspaceSettingsInput } from "@/lib/schemas";

export function GeneralSettingsForm({
  defaults,
  canEdit,
}: {
  defaults: WorkspaceSettingsInput;
  canEdit: boolean;
}) {
  const form = useForm<WorkspaceSettingsInput>({
    resolver: zodResolver(workspaceSettingsSchema),
    defaultValues: defaults,
  });
  const { errors, isDirty } = form.formState;
  const onSubmit = form.handleSubmit(() =>
    toast.info("Saving settings arrives in phase 2", {
      description: "The form validates; saving needs sign-in.",
    }),
  );

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} noValidate>
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="text-sm">Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="max-w-md">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="ws-name">Name</FieldLabel>
                <Input
                  id="ws-name"
                  disabled={!canEdit}
                  aria-invalid={!!errors.name}
                  {...form.register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field data-invalid={!!errors.slug}>
                <FieldLabel htmlFor="ws-slug">URL</FieldLabel>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">/app/</span>
                  <Input
                    id="ws-slug"
                    disabled={!canEdit}
                    aria-invalid={!!errors.slug}
                    className="font-mono"
                    {...form.register("slug")}
                  />
                </div>
                <FieldDescription>
                  Changing it breaks existing links to this workspace.
                </FieldDescription>
                <FieldError errors={[errors.slug]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ws-audience">Who is this for?</FieldLabel>
                <Controller
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                      <SelectTrigger id="ws-audience" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">My company</SelectItem>
                        <SelectItem value="clients">Clients I manage</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ws-rollouts">Editors can start rollouts</FieldLabel>
                <Controller
                  control={form.control}
                  name="rolloutsByEditors"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                      <SelectTrigger id="ws-rollouts" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never (admins only)</SelectItem>
                        <SelectItem value="with_approval">With an admin&apos;s approval</SelectItem>
                        <SelectItem value="always">Always</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field orientation="horizontal">
                <Controller
                  control={form.control}
                  name="requirePublishApproval"
                  render={({ field }) => (
                    <Switch
                      id="ws-approval"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canEdit}
                    />
                  )}
                />
                <FieldLabel htmlFor="ws-approval" className="font-normal">
                  Publishing a policy version needs a second admin&apos;s approval
                </FieldLabel>
              </Field>
            </FieldGroup>
            <Button type="submit" className="mt-6" disabled={!canEdit || !isDirty}>
              Save changes
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card className="border-destructive/40 gap-3">
        <CardHeader>
          <CardTitle className="text-sm">Delete workspace</CardTitle>
          <CardDescription>
            Removes policies, history and GitHub connections. Repositories and their files are not
            touched.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingButton
            variant="destructive"
            size="sm"
            phase={2}
            feature="Deleting workspaces"
            disabled={!canEdit}
          >
            Delete workspace
          </PendingButton>
        </CardContent>
      </Card>
    </div>
  );
}
