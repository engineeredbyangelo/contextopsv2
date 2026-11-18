"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Dark by default, with light mode and system preference available. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
