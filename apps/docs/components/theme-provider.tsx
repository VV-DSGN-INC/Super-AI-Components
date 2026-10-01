"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Class-based theming: next-themes puts `dark` on <html>, which is the
 *  selector globals.css already declares (`@custom-variant dark (&:is(.dark *))`)
 *  and the one Storybook's docs container toggles. `system` follows
 *  prefers-color-scheme until the visitor picks. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
