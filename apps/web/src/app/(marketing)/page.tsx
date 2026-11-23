import Link from "next/link";
import { StartFreeButton, TrustStrip, CTA } from "@/components/marketing/cta";
import { FileButton, HeroSyncProvider, SyncPrFrame } from "@/components/marketing/hero-sync";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ManagedBlockDemo } from "@/components/marketing/managed-block-demo";
import { ProductDemo } from "@/components/marketing/product-demo";
import { CONTAINER, H1, H2, H3, LEAD, SECTION } from "@/components/marketing/styles";
import { WhatWeStore } from "@/components/marketing/what-we-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SectionHeading({ id, title, text }: { id: string; title: string; text: string }) {
  return (
    <div className="space-y-3">
      <h2 id={id} className={H2}>
        {title}
      </h2>
      <p className={LEAD}>{text}</p>
    </div>
  );
}

/**
 * Hero: the habit being replaced, struck out as a diff line, then a real sync pull request
 * framed by the managed-block markers. Copy is server-rendered; the filename buttons and the
 * PR frame are the only client code.
 */
function Hero() {
  return (
    <section aria-labelledby="hero-heading" data-testid="hero" className="hero-glow">
      <HeroSyncProvider>
        <div
          className={cn(
            CONTAINER,
            "grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14 lg:py-24",
          )}
        >
          <div className="grid min-w-0 grid-cols-1 gap-7">
            <div className="grid gap-2">
              {/* Decorative: the h1 carries the message. */}
              <div
                aria-hidden
                className="bg-destructive/10 flex w-fit max-w-full items-center gap-2.5 rounded-md py-1 pr-2.5 font-mono text-xs sm:text-sm md:text-[15px]"
              >
                <span className="text-destructive w-7 shrink-0 text-center select-none">−</span>
                <code className="relative min-w-0 whitespace-nowrap">
                  cp ../api-gateway/CLAUDE.md ./CLAUDE.md
                  <span className="co-strike bg-destructive absolute inset-x-0 top-[52%] h-[1.5px] origin-left" />
                </code>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span
                  aria-hidden
                  className="co-rise bg-success/10 text-success w-7 shrink-0 self-center rounded-md py-0.5 text-center font-mono text-[clamp(1.05rem,2.6vw,1.9rem)] leading-tight font-medium select-none"
                >
                  +
                </span>
                <h1 id="hero-heading" className={cn(H1, "co-rise min-w-0")}>
                  Stop <span className="whitespace-nowrap">copy-pasting</span>{" "}
                  <span className="font-mono font-medium tracking-[-0.04em]">CLAUDE.md</span>.
                </h1>
              </div>
            </div>

            <p className={LEAD}>
              Write your agent rules once as a versioned policy. ContextOps renders{" "}
              <FileButton index={0} />, <FileButton index={1} /> and <FileButton index={2} />, opens
              a pull request in every repo, and flags hand edits within a minute.
            </p>

            <div className="flex flex-wrap gap-3">
              <StartFreeButton />
              <Button asChild size="lg" variant="outline" className={CTA}>
                <Link href="/app">Open the demo workspace</Link>
              </Button>
            </div>

            <TrustStrip />
          </div>

          <SyncPrFrame />
        </div>
      </HeroSyncProvider>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <Hero />

      {/* The sync pull request */}
      <section aria-labelledby="demo-heading" className={SECTION}>
        <div className={cn(CONTAINER, "space-y-16")}>
          <div className="space-y-8">
            <SectionHeading
              id="demo-heading"
              title="The sync pull request"
              text="The Northwind Labs demo workspace: a rollout across six repos, a hand edit that drifts, and the pull request that puts it right."
            />
            <ProductDemo />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className={H3}>What a first sync does to an existing file</h3>
              <p className={LEAD}>
                Only the region between the markers changes. Everything the file already had is
                kept, byte for byte, under a Repository notes heading.
              </p>
            </div>
            <ManagedBlockDemo />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className={SECTION}>
        <div className={cn(CONTAINER, "space-y-10")}>
          <SectionHeading
            id="how-heading"
            title="How it works"
            text="Write commands, standards and security rules once. ContextOps renders AGENTS.md, CLAUDE.md and Copilot instructions from it, so every agent reads the same rules."
          />
          <HowItWorks />
        </div>
      </section>

      {/* What we store */}
      <section aria-labelledby="store-heading" className={SECTION}>
        <div className={cn(CONTAINER, "space-y-10")}>
          <h2 id="store-heading" className={H2}>
            What we store
          </h2>
          <WhatWeStore />
        </div>
      </section>

      {/* Final CTA: ends where the hero started. */}
      <section aria-labelledby="cta-heading" className={SECTION}>
        <div className={cn(CONTAINER, "space-y-7")}>
          <div className="space-y-3">
            <h2 id="cta-heading" className={H2}>
              Your first sync PR in under 10 minutes
            </h2>
            <p className={LEAD}>
              Sign in with GitHub, install the App on one org, and review the pull request. Free for
              up to 5 repositories.
            </p>
          </div>
          <div>
            <StartFreeButton />
          </div>
          <TrustStrip />
        </div>
      </section>
    </>
  );
}
