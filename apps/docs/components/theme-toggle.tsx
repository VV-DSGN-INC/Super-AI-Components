"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";

const subscribeNever = () => () => {};

/** Flips between light and dark. On the server the resolved theme is unknown,
 *  so the button renders the "to dark" affordance and swaps once hydrated.
 *  `useSyncExternalStore` with a server snapshot of `false` is the mounted
 *  check that does not set state inside an effect, which this app's lint
 *  config rejects (`react-hooks/set-state-in-effect` is an error). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-slot="theme-toggle"
      className={className}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
