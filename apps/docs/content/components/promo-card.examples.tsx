"use client";

import { PromoCard } from "@/registry/super-ai/promo-card";

/**
 * Live examples for promo-card.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so promo-card.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<PersistedDismissal />`), so a prop
 * like `onDismiss` never has to be serialized across the server/client
 * boundary — it's created and consumed entirely inside this client module.
 */

export function PersistedDismissal() {
  return (
    <PromoCard
      flavour="upgrade"
      title="Upgrade to Pro"
      description="Unlock unlimited generations and priority rendering."
      ctaLabel="Upgrade"
      onCtaClick={() => {}}
      onDismiss={() => {}}
    />
  );
}

export function QuotaWarningWithNumber() {
  return (
    <PromoCard
      flavour="quota-warning"
      title="You're near your limit"
      description="You've used 90% of this month's generation credits."
      ctaLabel="Manage usage"
      onCtaClick={() => {}}
      onDismiss={() => {}}
    />
  );
}

export function SessionOnlyDismiss() {
  return <PromoCard flavour="invite" title="Invite your team" onDismiss={() => {}} />;
}

export function StackedCards() {
  return (
    <div className="flex flex-col gap-2">
      <PromoCard flavour="upgrade" title="Upgrade to Pro" onDismiss={() => {}} />
      <PromoCard flavour="invite" title="Invite your team" onDismiss={() => {}} />
    </div>
  );
}
