"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/** The design system's id, written onto <html> as `data-ds` so a census of a
 *  rendered page can attribute every `data-slot` under it to this system
 *  (ds-architecture stage 10; `runtime.systemId` in ds-architecture.config.json). */
const DS_SYSTEM_ID = "super-ai";

/** Class-based theming: next-themes puts `dark` on <html>, which is the
 *  selector globals.css already declares (`@custom-variant dark (&:is(.dark *))`)
 *  and the one Storybook's docs container toggles. `system` follows
 *  prefers-color-scheme until the visitor picks. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-ds", DS_SYSTEM_ID);
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
