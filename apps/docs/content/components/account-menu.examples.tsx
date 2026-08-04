"use client";

import * as React from "react";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AccountMenu } from "@/registry/super-ai/account-menu";

/**
 * Live examples for account-menu.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so account-menu.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself. Every example
 * lives here instead and crosses into the docs module as a zero-prop element
 * (e.g. `<IdentityFirstSignOutLast />`), so state and handlers never have to
 * be serialized across the server/client boundary.
 */

const SAMPLE_USER = { name: "Ada Lovelace", email: "ada@example.com" };

export function IdentityFirstSignOutLast() {
  const [theme, setTheme] = React.useState("light");
  const [background, setBackground] = React.useState("default");
  return (
    <AccountMenu
      user={SAMPLE_USER}
      theme={theme}
      onThemeChange={setTheme}
      background={background}
      onBackgroundChange={setBackground}
      items={[{ label: "Settings", icon: <Settings aria-hidden />, shortcut: ["⌘", ","] }]}
      onSignOut={() => {}}
    />
  );
}

export function AppearanceInNestedSubmenu() {
  const [theme, setTheme] = React.useState("dark");
  const [background, setBackground] = React.useState("forest");
  return (
    <AccountMenu
      user={SAMPLE_USER}
      theme={theme}
      onThemeChange={setTheme}
      background={background}
      onBackgroundChange={setBackground}
      onSignOut={() => {}}
    />
  );
}

export function AppearanceAsDialogWrong() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Appearance settings…</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Wrong: a whole modal round-trip just to flip the theme, when this is meant to be a nested menu the
          user can pop in and out of in one motion.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function ColorOnlySwatchesWrong() {
  return (
    <div className="bg-popover flex items-center gap-2 rounded-lg border p-3" aria-hidden="true">
      <span className="bg-chart-1 size-6 rounded-full" />
      <span className="bg-chart-2 size-6 rounded-full" />
      <span className="bg-chart-3 size-6 rounded-full" />
      <span className="bg-chart-4 size-6 rounded-full" />
      <span className="text-muted-foreground ml-2 text-xs">No names — colour is the only cue.</span>
    </div>
  );
}
