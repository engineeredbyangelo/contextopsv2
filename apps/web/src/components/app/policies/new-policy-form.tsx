"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus2, FileUp, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { newPolicySchema, slugify, type NewPolicyInput } from "@/lib/schemas";
import { POLICY_TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { ImportCandidate } from "@/server/data/types";

export function NewPolicyForm({ candidates }: { candidates: ImportCandidate[] }) {
  const form = useForm<NewPolicyInput>({
    resolver: zodResolver(newPolicySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      source: candidates[0]
        ? { kind: "import", repoId: candidates[0].repoId, path: candidates[0].path }
        : { kind: "template", template: POLICY_TEMPLATES[0].id },
    },
  });
  const source = useWatch({ control: form.control, name: "source" });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    toast.info("Creating policies arrives in phase 3", {
      description: "The form validates; saving needs the policy editor.",
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-medium">Start from</legend>
        <div className="grid gap-3 md:grid-cols-3">
          <SourceCard
            icon={FileUp}
            title="Import from a repo"
            description={
              candidates.length
                ? `We found ${candidates.length} existing agent file${candidates.length === 1 ? "" : "s"}.`
                : "No existing agent files found."
            }
            selected={source.kind === "import"}
            disabled={!candidates.length}
            onSelect={() =>
              candidates[0] &&
              form.setValue("source", {
                kind: "import",
                repoId: candidates[0].repoId,
                path: candidates[0].path,
              })
            }
          />
          <SourceCard
            icon={LayoutTemplate}
            title="Start from a template"
            description="Next.js + Supabase, Python service or Monorepo."
            selected={source.kind === "template"}
            onSelect={() =>
              form.setValue("source", { kind: "template", template: POLICY_TEMPLATES[0].id })
            }
          />
          <SourceCard
            icon={FilePlus2}
            title="Blank"
            description="Write every section yourself."
            selected={source.kind === "blank"}
            onSelect={() => form.setValue("source", { kind: "blank" })}
          />
        </div>

        {source.kind === "import" ? (
          <div role="radiogroup" aria-label="File to import" className="divide-y rounded-lg border">
            {candidates.map((c) => {
              const checked = source.repoId === c.repoId && source.path === c.path;
              return (
                <label
                  key={`${c.repoId}:${c.path}`}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="import"
                    checked={checked}
                    onChange={() =>
                      form.setValue("source", { kind: "import", repoId: c.repoId, path: c.path })
                    }
                  />
                  <span className="font-medium">{c.fullName}</span>
                  <code className="text-muted-foreground font-mono text-xs">{c.path}</code>
                </label>
              );
            })}
          </div>
        ) : null}

        {source.kind === "template" ? (
          <div role="radiogroup" aria-label="Template" className="divide-y rounded-lg border">
            {POLICY_TEMPLATES.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-start gap-3 px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="template"
                  className="mt-1"
                  checked={source.template === t.id}
                  onChange={() => form.setValue("source", { kind: "template", template: t.id })}
                />
                <span>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground block">{t.description}</span>
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </fieldset>

      <FieldGroup className="max-w-xl">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            aria-invalid={!!errors.name}
            {...form.register("name", {
              onChange: (e) => {
                if (!form.getFieldState("slug").isDirty)
                  form.setValue("slug", slugify(e.target.value, 64));
              },
            })}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.slug}>
          <FieldLabel htmlFor="slug">Slug</FieldLabel>
          <Input
            id="slug"
            aria-invalid={!!errors.slug}
            className="font-mono"
            {...form.register("slug")}
          />
          <FieldDescription>Used in the managed block and the sync branch name.</FieldDescription>
          <FieldError errors={[errors.slug]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea id="description" rows={2} {...form.register("description")} />
        </Field>
      </FieldGroup>

      <Button type="submit">Create draft</Button>
    </form>
  );
}

function SourceCard({
  icon: Icon,
  title,
  description,
  selected,
  disabled,
  onSelect,
}: {
  icon: typeof FileUp;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-4 text-left text-sm transition-colors disabled:opacity-50",
        selected ? "border-foreground/40 bg-accent" : "hover:bg-muted/50",
      )}
    >
      <Icon className="size-5" aria-hidden />
      <span className="font-medium">{title}</span>
      <span className="text-muted-foreground">{description}</span>
    </button>
  );
}
