"use client";

import { Apple, Building2, Globe, Sparkles } from "lucide-react";
import * as React from "react";

import { AuthShell, type AuthShellMode } from "@/registry/super-ai/auth-shell";

// Neutral marks on purpose: this registry ships no brand assets, and a
// provider's own logo is the caller's to supply.
const PROVIDERS = [
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
    disabled: true,
    disabledReason: "Ask an admin to enable SAML",
  },
];

export default function AuthShellDemo() {
  const [mode, setMode] = React.useState<AuthShellMode>("sign-in");

  return (
    <AuthShell
      className="h-[42rem]"
      mode={mode}
      onModeChange={setMode}
      providers={PROVIDERS}
      onSelectProvider={() => {}}
      onEmailSubmit={() => {}}
      terms={{ label: "Terms of Service", href: "/terms" }}
      privacy={{ label: "Privacy Policy", href: "/privacy" }}
      marketing={
        <>
          <Sparkles aria-hidden className="text-foreground size-5" />
          <p className="text-foreground text-lg font-medium text-balance">
            Northwind turns a brief into a finished render in about a minute.
          </p>
          <p className="text-foreground/70 text-sm">
            Your first ten renders are free, and everything you make stays private until you share it.
          </p>
        </>
      }
    />
  );
}
