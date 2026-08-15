"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { Kbd, KbdGroup } from "./kbd";

/**
 * Account Menu — Avatar menu with nested appearance submenu
 *
 * Spec: docs/design-system/component-specs.md#b8-account-menu
 * States: theme-radio · background-swatches · shortcut-hints
 *
 * - Identity block on top, sign-out last, separated by rules — conventional
 *   order, not reinvented here.
 * - Appearance is a nested submenu (DropdownMenuSub), never a dialog: theme
 *   changes often and shouldn't cost a modal round-trip.
 * - Theme options use the menu's own radio primitive (real `menuitemradio`
 *   semantics). Background options use the standalone Radio primitive styled
 *   as swatches, because a swatch's "checked" state needs to be a border/ring,
 *   not the menu radio's built-in filled-background indicator.
 */

interface AccountMenuUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AccountMenuItem {
  label: string;
  icon?: React.ReactNode;
  /** Rendered as a KbdGroup — a row that has a shortcut must show it. */
  shortcut?: string[];
  onSelect?: () => void;
  variant?: "default" | "destructive";
}

interface AccountMenuThemeOption {
  value: string;
  label: string;
}

interface AccountMenuBackgroundOption {
  value: string;
  label: string;
  /**
   * Semantic bg-* class(es) only — no hex, no palette classes, no raw OKLCH.
   * Include the same token under the `data-checked:` (and, if it should hold
   * in dark mode, `dark:data-checked:`) variant so the swatch keeps its own
   * color once selected, overriding the primitive's default filled-primary
   * checked state, e.g. "bg-chart-1 data-checked:bg-chart-1".
   */
  swatchClassName: string;
}

interface AccountMenuProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  user: AccountMenuUser;
  items?: AccountMenuItem[];
  theme: string;
  onThemeChange: (value: string) => void;
  themes?: AccountMenuThemeOption[];
  background: string;
  onBackgroundChange: (value: string) => void;
  backgrounds?: AccountMenuBackgroundOption[];
  onSignOut: () => void;
  signOutLabel?: string;
  signOutShortcut?: string[];
}

const DEFAULT_THEMES: AccountMenuThemeOption[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const DEFAULT_BACKGROUNDS: AccountMenuBackgroundOption[] = [
  { value: "default", label: "Default", swatchClassName: "bg-chart-1 data-checked:bg-chart-1 dark:data-checked:bg-chart-1" },
  { value: "slate", label: "Slate", swatchClassName: "bg-chart-2 data-checked:bg-chart-2 dark:data-checked:bg-chart-2" },
  { value: "stone", label: "Stone", swatchClassName: "bg-chart-3 data-checked:bg-chart-3 dark:data-checked:bg-chart-3" },
  { value: "forest", label: "Forest", swatchClassName: "bg-chart-4 data-checked:bg-chart-4 dark:data-checked:bg-chart-4" },
  { value: "ink", label: "Ink", swatchClassName: "bg-chart-5 data-checked:bg-chart-5 dark:data-checked:bg-chart-5" },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AccountMenuAvatar({ user, className }: { user: AccountMenuUser; className?: string }) {
  return (
    <span
      data-slot="account-menu-avatar"
      aria-hidden="true"
      className={cn(
        "bg-muted text-foreground flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-medium",
        className,
      )}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initials(user.name)
      )}
    </span>
  );
}

function AccountMenuShortcutHint({ keys }: { keys: string[] }) {
  return (
    // `ms-auto`, not `ml-auto` — a logical property in a component that has no
    // business naming a physical side. Measured, and worth being honest about:
    // the swap changes nothing today, because the row's label is `flex-1` and
    // absorbs the free space this margin would otherwise take, so the hint
    // already lands at the logical end in both directions. It matters the day
    // that `flex-1` moves.
    <KbdGroup data-slot="account-menu-shortcut" aria-hidden="true" className="ms-auto">
      {keys.map((key, i) => (
        <Kbd key={`${i}-${key}`}>{key}</Kbd>
      ))}
    </KbdGroup>
  );
}

function AccountMenu({
  user,
  items = [],
  theme,
  onThemeChange,
  themes = DEFAULT_THEMES,
  background,
  onBackgroundChange,
  backgrounds = DEFAULT_BACKGROUNDS,
  onSignOut,
  signOutLabel = "Sign out",
  signOutShortcut,
  className,
  ...props
}: AccountMenuProps) {
  return (
    <div data-slot="account-menu" className={cn("inline-flex", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="account-menu-trigger"
          render={
            <button
              type="button"
              aria-label={`Account menu for ${user.name}`}
              className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2"
            />
          }
        >
          <AccountMenuAvatar user={user} />
        </DropdownMenuTrigger>

        {/* The popup animates through `data-open:animate-in` /
            `data-closed:animate-out`, and the registry's usual bare
            `motion-reduce:animate-none` is inert against it: Tailwind compiles
            both to a single class of specificity, and emits the plain
            `motion-reduce:` block before the `data-*` variants, so `animation:
            enter` wins the tie. Restating the variant sorts after it and wins.
            See CONTINUE.md §9 — this component is on that list. */}
        <DropdownMenuContent
          className="w-64 motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
        >
          {/* Identity block on top — conventional order, do not reinvent it. */}
          <div data-slot="account-menu-identity" className="flex items-center gap-2 px-1.5 py-1.5">
            <AccountMenuAvatar user={user} />
            <div className="flex min-w-0 flex-col">
              <span data-slot="account-menu-name" className="truncate text-sm font-medium">
                {user.name}
              </span>
              <span data-slot="account-menu-email" className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </div>

          {items.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {items.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    data-slot="account-menu-item"
                    variant={item.variant}
                    onClick={item.onSelect}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {/* A row that has a shortcut must show it, or the shortcut is
                        never learned. */}
                    {item.shortcut ? <AccountMenuShortcutHint keys={item.shortcut} /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          ) : null}

          <DropdownMenuSeparator />

          {/* Appearance is a nested submenu, not a dialog — theme is changed
              often and should not cost a modal. */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger data-slot="account-menu-appearance-trigger">Appearance</DropdownMenuSubTrigger>
            {/* Same restated variant as the parent popup — the submenu carries
                its own copy of the animation classes. */}
            <DropdownMenuSubContent
              data-slot="account-menu-appearance-content"
              className="w-56 motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
            >
              {/* DropdownMenuLabel (Menu.GroupLabel) needs a Menu.Group /
                  Menu.RadioGroup ancestor for its context — nest it inside
                  the radio group rather than placing it as a sibling. */}
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => onThemeChange(value as string)}
                data-slot="account-menu-theme-group"
              >
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                {themes.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} data-slot="account-menu-theme-item">
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />

              {/* The standalone Radio primitive has no Menu.Group context, so
                  its heading is a plain label matching DropdownMenuLabel's
                  visual style rather than the Menu-bound component. */}
              <div
                data-slot="account-menu-background-heading"
                className="text-muted-foreground px-1.5 py-1 text-xs font-medium"
              >
                Background
              </div>
              <RadioGroup
                value={background}
                onValueChange={(value) => onBackgroundChange(value as string)}
                data-slot="account-menu-background-group"
                className="flex w-auto flex-wrap gap-2 px-1.5 py-1"
              >
                {backgrounds.map((option) => (
                  <RadioGroupItem
                    key={option.value}
                    value={option.value}
                    // Swatches convey selection by colour alone unless named —
                    // the accessible name carries the label the eye can't.
                    aria-label={option.label}
                    data-slot="account-menu-background-swatch"
                    className={cn("size-6 border-2", option.swatchClassName)}
                  />
                ))}
              </RadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Sign-out last, separated by a rule — conventional order. */}
          <DropdownMenuItem data-slot="account-menu-sign-out" variant="destructive" onClick={onSignOut}>
            <span className="flex-1">{signOutLabel}</span>
            {signOutShortcut ? <AccountMenuShortcutHint keys={signOutShortcut} /> : null}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { AccountMenu };
export type { AccountMenuProps, AccountMenuUser, AccountMenuItem, AccountMenuThemeOption, AccountMenuBackgroundOption };
