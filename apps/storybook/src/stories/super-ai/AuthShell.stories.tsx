import type { Meta, StoryObj } from "@storybook/react-vite";
import { Apple, Building2, Globe, Sparkles } from "lucide-react";

import { AuthShellDocs } from "@/content/components/auth-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { AuthShell, type AuthShellProps } from "@/registry/super-ai/auth-shell";

// Neutral marks: lucide ships no brand glyphs, and this registry ships no
// brand assets either — a provider's own logo is the caller's to supply.
const PROVIDERS: AuthShellProps["providers"] = [
  {
    id: "google",
    name: "Google",
    icon: <Globe className="size-4" />,
    description: "ada@northwind.com",
    trailing: <span className="text-foreground text-xs">Last used</span>,
  },
  { id: "apple", name: "Apple", icon: <Apple className="size-4" /> },
  {
    id: "sso",
    name: "Northwind SSO",
    icon: <Building2 className="size-4" />,
    description: "Single sign-on for everyone on your domain",
  },
];

const MARKETING = (
  <>
    <Sparkles aria-hidden className="text-foreground size-5" />
    <p className="text-foreground text-lg font-medium text-balance">
      Northwind turns a brief into a finished render in about a minute.
    </p>
    <p className="text-foreground/70 text-sm">
      Your first ten renders are free, and everything you make stays private until you share it.
    </p>
  </>
);

const FULL_ARGS: AuthShellProps = {
  mode: "sign-in",
  providers: PROVIDERS,
  marketing: MARKETING,
  onSelectProvider: () => {},
  onEmailSubmit: () => {},
  onModeChange: () => {},
  terms: { label: "Terms of Service", href: "/terms" },
  privacy: { label: "Privacy Policy", href: "/privacy" },
};

const meta: Meta<typeof AuthShell> = {
  title: "Super AI/Auth Shell",
  component: AuthShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(AuthShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AuthShell>;

/** The working screen: three providers, a pitch pane, the email fallback and the legal line. */
export const SignIn: Story = { args: FULL_ARGS };

/** The same screen with sign-up copy. One component, two modes, no second layout. */
export const SignUp: Story = { args: { ...FULL_ARGS, mode: "sign-up" } };

/**
 * Day one, before anyone has wired an identity stack up: no providers, no
 * pitch. Both regions stay mounted and fall to L1 rather than collapsing, so
 * the shape of the screen is visible before it has any content — and the email
 * form below is a complete sign-in route on its own. Mandatory export for the
 * block contract.
 */
export const Empty: Story = {
  args: { onEmailSubmit: () => {} },
};

/**
 * An identity provider that exists but is not available to this person. It is
 * a real `<button disabled>`, and the reason is written out — dimming on its
 * own is state conveyed by colour, and it leaves a dead row with no
 * explanation.
 */
export const ProviderUnavailable: Story = {
  args: {
    ...FULL_ARGS,
    providers: [
      PROVIDERS![0],
      PROVIDERS![1],
      {
        id: "sso",
        name: "Northwind SSO",
        icon: <Building2 className="size-4" />,
        disabled: true,
        disabledReason: "Ask an admin to enable SAML",
      },
    ],
  },
};

/**
 * Narrow viewport. Below `md` the split collapses to one column, the pitch pane
 * drops under the form (it is after the form in the DOM whichever side it sits
 * on, so reading order never changed), and the card takes the full width.
 * Mandatory export for the block contract — a shell is a layout, and layout is
 * what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing at all while looking
 * configured. `options` is declared explicitly rather than relying on a
 * built-in list, so the selection cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout here is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};
