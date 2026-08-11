"use client";

import { KeyRound } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { OnboardingWizard, type OnboardingWizardStep } from "@/registry/super-ai/onboarding-wizard";

/**
 * Auth Shell — sign in / sign up
 *
 * Spec: docs/design-system/block-specs.md#o14-auth-shell
 * Regions: marketing-panel · provider-rows · email-fallback · legal-footer
 *
 * Three sentences from the spec drive everything here:
 *
 * 1. "UI only, no auth logic. Providers and copy are props; the shell has no
 *    opinion about your identity stack." There is no SDK import, no provider
 *    registry, no hard-coded list of vendors and no notion of a session. The
 *    shell renders whatever `providers` it is handed and calls back; picking
 *    a row is an event, never a redirect this component performs.
 * 2. "The marketing panel is the same split layout as L6 — auth and first-run
 *    are one visual family." So the split is not re-cut here: the whole card
 *    is one L6 `onboarding-wizard` step, and the marketing pane goes into
 *    L6's own `panel` slot. See WIZARD_WITHOUT_STEPS for the one place that
 *    composition does not fit.
 * 3. "Terms and privacy links are part of the component, not an afterthought."
 *    The legal footer is a declared region inside the card, mounted
 *    unconditionally, with real hrefs as props rather than a slot the caller
 *    can quietly leave empty.
 *
 * The provider rows are A9 `entity-row`, not bespoke buttons — the wireframe
 * reconciliation at the top of block-specs.md settled that explicitly ("O14
 * listed `provider buttons` in Regions while its own Filled by: said A9
 * provider *rows*… `provider rows` is correct"). A9 gives each provider an
 * icon, a title, a description and a trailing slot for "Last used", which is
 * exactly the anatomy a real provider list wants.
 */

/**
 * L6 is a wizard: it always draws a progress rail and a Back / Skip / primary
 * footer. A sign-in screen has one step, no ordering and nothing to skip, so
 * that chrome would read as "step 1 of 1, last step" over a Back button that
 * can never be pressed — three controls in the tab order that do nothing.
 *
 * Suppressed rather than reimplemented: the spec names L6's split-panel
 * variant, and everything else about L6 — the card frame, the heading and its
 * focus handling, the `md:grid-cols-2` split, the `panelSide` flip — is the
 * shared layout the spec is asking for. `hidden` is `display: none`, so the
 * three buttons leave the accessibility tree and the tab order entirely; that
 * is the intent, not a visual-only hide.
 *
 * RECOMMENDED SOURCE FIX: give L6 a `chrome` opt-out (`progress={false}` /
 * `nav={false}`), so a single-step split-panel surface can compose it without
 * a call-site override. Delete this the moment that lands.
 */
const WIZARD_WITHOUT_STEPS =
  "[&_[data-slot=onboarding-wizard-progress]]:hidden [&_[data-slot=onboarding-wizard-nav]]:hidden";

/**
 * L6's panel is `bg-muted`, and this registry's muted foreground measures
 * 4.34:1 against it — under the 4.5:1 minimum. The marketing pane is a slot,
 * so whatever a caller drops in there brings its own `text-muted-foreground`
 * with it and no amount of styling on this wrapper's own slots can reach it.
 * Rebinding the variable at the top of the pane fixes every descendant at
 * once, composed children included. See a11y-baseline.md §"The rule".
 */
const MARKETING_PANEL_ON_MUTED = "[--muted-foreground:var(--foreground)]";

/**
 * The vendored `FieldSeparator` paints its "or" chip `bg-background` so it can
 * sit on top of the rule. Inside a card that is the wrong token — `--card` and
 * `--background` are the same value in light mode and diverge in dark, so the
 * chip renders as a darker notch across the divider. The chip is an inner
 * element the primitive exposes no prop for, hence the descendant variant.
 */
const DIVIDER_ON_CARD = "[&_[data-slot=field-separator-content]]:bg-card";

type AuthShellMode = "sign-in" | "sign-up";

interface AuthShellLink {
  label: string;
  href: string;
}

interface AuthShellProvider {
  /** Stable id, passed back to `onSelectProvider`. Never rendered. */
  id: string;
  /** The identity provider's name — "Google", "GitHub", "your SSO provider". */
  name: string;
  /** Overrides the default "Continue with {name}" row title. */
  title?: React.ReactNode;
  /** The second line: "you@northwind.com", "Recommended for your team". */
  description?: React.ReactNode;
  /** The provider mark. Decorative — the row title is the accessible name. */
  icon?: React.ReactNode;
  /** Trailing slot: "Last used", a badge, a keyboard hint. */
  trailing?: React.ReactNode;
  disabled?: boolean;
  /**
   * Why it is unavailable, in words. Rendered as the row's description, so an
   * unavailable provider is never signalled by dimming alone.
   */
  disabledReason?: React.ReactNode;
  /** Per-provider handler. Takes precedence over `onSelectProvider`. */
  onSelect?: () => void;
}

interface AuthShellProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Which side of the same screen this is. Drives the default copy only. */
  mode?: AuthShellMode;
  /** Heading. Defaults from `mode`. */
  title?: React.ReactNode;
  /** Subheading under the title. Defaults from `mode`. */
  description?: React.ReactNode;

  /** The pitch pane. Anything: a logo, a quote, a screenshot, a feature list. */
  marketing?: React.ReactNode;
  /** Which side the pitch sits on visually. The form is always first in reading order. */
  marketingSide?: "start" | "end";
  /** Replaces the default L1 shown when there is no pitch yet. */
  marketingEmpty?: React.ReactNode;

  /** The identity providers, in the order you want them tried. */
  providers?: AuthShellProvider[];
  /** Fires with the provider id, unless that provider carries its own `onSelect`. */
  onSelectProvider?: (id: string) => void;
  /** Accessible name of the provider group. */
  providersLabel?: string;
  /** Replaces the default L1 shown when no providers are configured. */
  providersEmpty?: React.ReactNode;

  /** Controlled email value. Omit to let the shell hold the field. */
  email?: string;
  defaultEmail?: string;
  onEmailChange?: (email: string) => void;
  /** Fires with the address on submit. What you do with it is yours. */
  onEmailSubmit?: (email: string) => void;
  emailLabel?: string;
  emailPlaceholder?: string;
  emailSubmitLabel?: string;
  /** The word on the divider above the email form. */
  dividerLabel?: string;
  /** Replaces the whole email form — a magic-link explainer, an SSO domain field. */
  emailFallback?: React.ReactNode;

  /** Supply this to render the sign-in ⇄ sign-up switch. Omitted, there is no switch. */
  onModeChange?: (mode: AuthShellMode) => void;
  modeSwitchPrompt?: React.ReactNode;
  modeSwitchLabel?: string;

  terms?: AuthShellLink;
  privacy?: AuthShellLink;
  /** Lead-in sentence before the two links. */
  legalPrefix?: React.ReactNode;
  /** Replaces the whole legal line. The region still renders. */
  legal?: React.ReactNode;
}

const MODE_COPY: Record<
  AuthShellMode,
  { title: string; description: string; switchPrompt: string; switchLabel: string }
> = {
  "sign-in": {
    title: "Sign in",
    description: "Pick a provider, or continue with your email address.",
    switchPrompt: "New here?",
    switchLabel: "Create an account",
  },
  "sign-up": {
    title: "Create your account",
    description: "Pick a provider, or sign up with your email address.",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
  },
};

function AuthShell({
  mode = "sign-in",
  title,
  description,

  marketing,
  marketingSide = "start",
  marketingEmpty,

  providers = [],
  onSelectProvider,
  providersLabel,
  providersEmpty,

  email: emailProp,
  defaultEmail = "",
  onEmailChange,
  onEmailSubmit,
  emailLabel = "Email",
  emailPlaceholder = "you@company.com",
  emailSubmitLabel = "Continue with email",
  dividerLabel = "or",
  emailFallback,

  onModeChange,
  modeSwitchPrompt,
  modeSwitchLabel,

  terms = { label: "Terms of Service", href: "/terms" },
  privacy = { label: "Privacy Policy", href: "/privacy" },
  legalPrefix = "By continuing, you agree to our",
  legal,

  className,
  ...props
}: AuthShellProps) {
  const copy = MODE_COPY[mode];
  const emailId = React.useId();

  const [internalEmail, setInternalEmail] = React.useState(defaultEmail);
  const emailControlled = emailProp !== undefined;
  const emailValue = emailControlled ? emailProp : internalEmail;

  const handleEmailChange = (value: string) => {
    if (!emailControlled) setInternalEmail(value);
    onEmailChange?.(value);
  };

  const marketingPanel = (
    <div
      data-region="marketing-panel"
      // The rebind, not a restyle: composed children carry their own muted
      // foreground and a slot-level fix cannot reach them.
      className={cn("flex h-full flex-col justify-center gap-3", MARKETING_PANEL_ON_MUTED)}
    >
      {marketing ?? marketingEmpty ?? (
        <EmptyState
          size="panel"
          title="Say why this account is worth making"
          description="The pitch pane is a slot. Put the product name, a line of positioning, or the one screenshot that explains it."
        />
      )}
    </div>
  );

  const providerRows = (
    <div
      data-region="provider-rows"
      role="group"
      aria-label={providersLabel ?? (mode === "sign-up" ? "Sign-up providers" : "Sign-in providers")}
      className="flex flex-col gap-1"
    >
      {providers.length > 0
        ? providers.map((provider) => (
            <EntityRow
              key={provider.id}
              data-provider-id={provider.id}
              icon={provider.icon}
              title={provider.title ?? `Continue with ${provider.name}`}
              // An unavailable provider says so in words. A9 already dims the
              // row; dimming on its own is state conveyed by colour.
              description={
                provider.disabled ? (provider.disabledReason ?? "Unavailable") : provider.description
              }
              trailing={provider.trailing}
              disabled={provider.disabled}
              // Always handed a handler, so A9 takes its <button> branch and a
              // disabled provider gets the real `disabled` attribute rather
              // than a div that only looks inert.
              onSelect={provider.onSelect ?? (() => onSelectProvider?.(provider.id))}
              className="border-border border"
            />
          ))
        : (providersEmpty ?? (
            <EmptyState
              size="panel"
              icon={<KeyRound />}
              title="No providers configured"
              description="Pass a provider list, or let people continue with email below."
            />
          ))}
    </div>
  );

  const emailRegion = (
    <div data-region="email-fallback" className={cn("flex flex-col gap-4", DIVIDER_ON_CARD)}>
      {emailFallback ?? (
        <>
          <FieldSeparator>{dividerLabel}</FieldSeparator>
          <form
            data-slot="auth-shell-email-form"
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              // The shell never navigates and never posts: a default form
              // submission here would reload the page out from under whatever
              // the caller actually wanted to do with the address.
              event.preventDefault();
              onEmailSubmit?.(emailValue);
            }}
          >
            <Field>
              <FieldLabel htmlFor={emailId}>{emailLabel}</FieldLabel>
              <Input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={emailPlaceholder}
                value={emailValue}
                onChange={(event) => handleEmailChange(event.target.value)}
              />
            </Field>
            <Button type="submit" data-slot="auth-shell-email-submit">
              {emailSubmitLabel}
            </Button>
          </form>
        </>
      )}
    </div>
  );

  const modeSwitch = onModeChange ? (
    <p data-slot="auth-shell-mode-switch" className="text-foreground text-sm">
      {modeSwitchPrompt ?? copy.switchPrompt}{" "}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto px-0"
        onClick={() => onModeChange(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {modeSwitchLabel ?? copy.switchLabel}
      </Button>
    </p>
  ) : null;

  const legalFooter = (
    <div data-region="legal-footer" className="border-t pt-4">
      {legal ?? (
        // text-foreground, not muted: legal text is the one line on this screen
        // that has to stay readable, and quietness comes from size.
        <p data-slot="auth-shell-legal" className="text-foreground text-xs">
          {legalPrefix}{" "}
          <a href={terms.href} className="underline underline-offset-2">
            {terms.label}
          </a>{" "}
          and{" "}
          <a href={privacy.href} className="underline underline-offset-2">
            {privacy.label}
          </a>
          .
        </p>
      )}
    </div>
  );

  const step: OnboardingWizardStep = {
    id: "auth",
    title: title ?? copy.title,
    description: description ?? copy.description,
    panel: marketingPanel,
    panelSide: marketingSide,
    content: (
      <div className="flex flex-col gap-4">
        {providerRows}
        {emailRegion}
        {modeSwitch}
        {legalFooter}
      </div>
    ),
  };

  return (
    <div
      data-slot="auth-shell"
      data-mode={mode}
      // The card is centred with `m-auto` on the card itself rather than
      // `items-center` on this row. Centring a flex item that is taller than
      // its scrolling parent puts the overflow above the scroll origin, where
      // it cannot be reached — on a phone that silently eats the heading. Auto
      // margins collapse to zero when there is no spare room, so the card
      // centres when it fits and scrolls from the top when it does not.
      className={cn("bg-background text-foreground flex h-full w-full overflow-y-auto p-4 sm:p-8", className)}
      {...props}
    >
      <OnboardingWizard steps={[step]} className={cn("m-auto max-w-4xl", WIZARD_WITHOUT_STEPS)} />
    </div>
  );
}

export { AuthShell };
export type { AuthShellLink, AuthShellMode, AuthShellProps, AuthShellProvider };
