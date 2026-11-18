import Link from "next/link";
import { GitBranch } from "lucide-react";
import { PendingButton } from "@/components/app/pending-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
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
        <p className="text-center text-sm">
          <Link href="/app" className="text-muted-foreground hover:text-foreground underline">
            Explore the demo workspace
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
