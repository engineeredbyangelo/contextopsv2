import { Logo } from "@/components/app/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center px-4 md:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 justify-center px-4 py-10 md:px-6">{children}</main>
    </div>
  );
}
