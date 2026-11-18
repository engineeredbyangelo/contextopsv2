import { Suspense } from "react";
import { GitBranch } from "lucide-react";
import { PendingButton } from "@/components/app/pending-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInAsDemo } from "@/server/actions/auth";
import { demoSignInEnabled } from "@/server/auth/demo";

export const metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  demo_failed:
    "Demo sign-in failed. Reset the local database (`pnpm db:reset`) so the demo user exists.",
  demo_disabled: "Demo sign-in is turned off. Set DEMO_SIGN_IN=true in apps/web/.env.local.",
  auth_not_configured: "GitHub sign-in arrives in phase 2.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Card className="h-fit w-full max-w-sm gap-6">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">
          <h1>Sign in to ContextOps</h1>
        </CardTitle>
        <CardDescription>Use the GitHub account your team already has.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PendingButton className="w-full" size="lg" phase={2} feature="GitHub sign-in">
          <GitBranch /> Continue with GitHub
        </PendingButton>
        <p className="text-muted-foreground text-center text-xs">
          Signing in doesn&apos;t give ContextOps access to your repositories. That happens when an
          org admin installs the app.
        </p>
        {demoSignInEnabled() && (
          <Suspense>
            <DemoSignIn searchParams={searchParams} />
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
}

async function DemoSignIn({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next, error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  return (
    <form action={signInAsDemo} className="space-y-3 border-t pt-4">
      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <input type="hidden" name="next" value={typeof next === "string" ? next : "/app"} />
      <Button type="submit" variant="outline" className="w-full">
        Sign in as demo user
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        Development only: Maya Okafor, owner of Northwind Labs.
      </p>
    </form>
  );
}
