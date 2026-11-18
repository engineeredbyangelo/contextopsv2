import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TARGETS, isTargetId, type PolicyContent } from "@contextops/policy-schema";
import { Badge } from "@/components/ui/badge";

/** Read-only, structured view of policy content. The rendered markdown preview arrives with the renderer (phase 2). */
export function PolicyContentView({ content }: { content: PolicyContent }) {
  const commands = Object.entries(content.commands).filter(([, v]) => v);
  const overrides = Object.entries(content.overrides).filter(
    ([, v]) => v && (v.append || ("mode" in v && v.mode === "import")),
  );
  return (
    <div className="space-y-6 text-sm">
      <Section title="Overview">
        <p>{content.overview.summary}</p>
        {content.overview.stack.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {content.overview.stack.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        ) : null}
      </Section>

      {commands.length ? (
        <Section title="Commands">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {commands.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground capitalize">{k}</dt>
                <dd>
                  <code className="font-mono text-xs">{v}</code>
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      {content.codingStandards.length ? (
        <Section title="Coding standards">
          <ul className="space-y-1.5">
            {content.codingStandards.map((s) => (
              <li key={s.rule} className="flex items-start gap-2">
                <Badge
                  variant={s.severity === "must" ? "default" : "outline"}
                  className="mt-0.5 w-12 justify-center uppercase"
                >
                  {s.severity}
                </Badge>
                <span>{s.rule}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Security">
        <div className="space-y-2">
          {content.security.secrets ? <p>{content.security.secrets}</p> : null}
          {content.security.dependencies ? <p>{content.security.dependencies}</p> : null}
          {content.security.forbiddenPaths.length ? (
            <p>
              <span className="text-muted-foreground">Forbidden paths: </span>
              {content.security.forbiddenPaths.map((p, i) => (
                <span key={p}>
                  {i ? ", " : ""}
                  <code className="font-mono text-xs">{p}</code>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </Section>

      <Section title="Pull requests">
        <ul className="list-disc space-y-1 pl-5">
          {content.pullRequests.branchNaming ? (
            <li>Branches: {content.pullRequests.branchNaming}</li>
          ) : null}
          <li>
            Commits:{" "}
            {content.pullRequests.commitStyle === "conventional"
              ? "Conventional Commits"
              : "Free-form"}
          </li>
          {content.pullRequests.checklist.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Section>

      {overrides.length ? (
        <Section title="Target overrides">
          <ul className="space-y-2">
            {overrides.map(([target, o]) => (
              <li key={target}>
                <span className="font-medium">
                  {isTargetId(target) ? TARGETS[target].label : target}
                </span>
                {o && "mode" in o && o.mode === "import" ? (
                  <span className="text-muted-foreground"> · imports @AGENTS.md</span>
                ) : null}
                {o?.append ? <p className="text-muted-foreground">{o.append}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {content.freeform ? (
        <Section title="Additional notes">
          <div className="space-y-2 [&_a]:underline [&_code]:font-mono [&_code]:text-xs [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.freeform}</ReactMarkdown>
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
