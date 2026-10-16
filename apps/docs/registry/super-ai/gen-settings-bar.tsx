"use client";

import * as React from "react";
import { Toolbar } from "@base-ui/react/toolbar";

import { cn } from "@/lib/utils";

const GenSettingsBarContext = React.createContext<{ disabled: boolean }>({ disabled: false });

interface GenSettingsBarProps extends React.ComponentProps<"div"> {
  disabled?: boolean;
}

function GenSettingsBar({ disabled = false, className, ...props }: GenSettingsBarProps) {
  return (
    <GenSettingsBarContext.Provider value={{ disabled }}>
      {/* Base UI's Toolbar supplies the APG toolbar pattern, the same way
          context-toolbar composes it: one tab stop, and Left/Right move
          between items and wrap. `disabled` stays on the
          items rather than on the root, so one item can still opt back in. */}
      <Toolbar.Root
        data-slot="gen-settings-bar"
        data-disabled={disabled || undefined}
        className={cn(
          // text-foreground, not text-muted-foreground: bg-muted/50 only
          // clears 4.5:1 by a ~0.04 margin, and only against this exact
          // ancestor background (see docs/design-system/a11y-baseline.md) —
          // fragile, and it's what every item's label text actually
          // inherits. text-foreground keeps the toolbar's quiet tint and
          // clears contrast regardless of what sits behind it.
          //
          // That covers inherited colour but not a composed child that sets
          // text-muted-foreground itself, which a slot-level choice cannot
          // reach. Rebinding the variable on the painted surface does — the
          // house rule for any component that paints its own background.
          "bg-muted/50 text-foreground [--muted-foreground:var(--accent-foreground)] inline-flex items-center gap-0.5 rounded-md border p-0.5 text-xs",
          className,
        )}
        {...props}
      />
    </GenSettingsBarContext.Provider>
  );
}

function GenSettingsItem({ className, disabled, ...props }: React.ComponentProps<"button">) {
  const ctx = React.useContext(GenSettingsBarContext);
  const isDisabled = disabled ?? ctx.disabled;
  return (
    <Toolbar.Button
      type="button"
      data-slot="gen-settings-item"
      disabled={isDisabled}
      // Base UI keeps a disabled toolbar item focusable by default. This bar
      // documents a natively disabled button that leaves the walk, which is
      // what a locked, mid-run strip should do, so that behaviour is kept.
      // Only on items that are actually disabled: Toolbar.Root (1.5.0) adds
      // every item whose metadata says `focusableWhenDisabled: false` to its
      // skip list whether or not the item is disabled, so setting it
      // unconditionally leaves the arrows nowhere to go.
      focusableWhenDisabled={!isDisabled}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none inline-flex items-center gap-1 rounded px-2 py-1 transition-colors disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { GenSettingsBar, GenSettingsItem };
