# Q7 · Billing section scope — Design Specification

**Date:** 2026-08-03
**Status:** Proposed — awaiting approval
**Resolves:** Q7, raised in
[2026-08-03-settings-shell-usage-billing-design.md](2026-08-03-settings-shell-usage-billing-design.md)
**Affects:** Wave 10 (`M + settings-shell`) · catalog totals · family M

---

## 1. The question

> Does the Billing section of `settings-shell` need `payment-method-card` + `invoice-list` before
> Wave 10, or can it ship as upgrade-only (M4 `pricing-table` alone) with history and payment
> management deferred?

The prior spec found the gap and deliberately did not scope it. This resolves it.

## 2. Recommendation

**Neither. Do not build them — not in Wave 10, not later.** The Billing section ships as
M4 `pricing-table` plus a deep-link row out to the payment provider's own hosted portal. That row
needs **no new component**: it is A9 `entity-row` in M1 `settings-dialog`'s existing row grid, the
same construction as every other settings row.

Net effect on the catalog: **no change.** Family M stays at 7, the registry stays at 107, Wave 10
ships as originally sized.

## 3. Why

### 3.1 It contradicts a binding design principle

Money principle #6 in the [approved spec](2026-06-10-super-ai-components-design.md) reads:

> **Credits surface at the point of spend — embeddable chips, not buried billing pages.**

The whole M family is built on that sentence. `credits-indicator` is persistent and clickable,
`paywall-message` lives in the chat stream, `quota-meter` sits at the point of decision,
tier badges gate rows in place. Adding an invoice table and a card-on-file form builds the buried
billing page the principle exists to argue against.

### 3.2 It collides with a stated non-goal

[§12 Non-goals](2026-06-10-super-ai-components-design.md): *"No data fetching, auth, or **billing
logic** — UI only, callbacks out."*

`invoice-list` survives this as pure presentation. `payment-method-card` does not. Card capture in
practice means mounting a provider iframe (Stripe Elements or equivalent), because PCI scope is the
reason nobody hand-rolls a card field. A component whose real implementation is "embed someone
else's iframe" is not a registry component — it is a wrapper around the thing the consumer already
has.

### 3.3 Neither has AI-specific anatomy

This is the strongest reason. Every other M component encodes something specific to AI products:
per-resource metering because AI plans meter several things at once; a paywall card carrying the
prompt and model it *would* have used; a rate-limit banner distinguishing your quota from provider
capacity. Those are load-bearing insights that a generic SaaS kit does not contain.

An invoice row is date · amount · status · download. A saved-card row is brand · last four · expiry
· default marker. They are byte-identical in a CRM, a hosting dashboard, or an email tool. The
registry's thesis is that AI products share an anatomy that generic kits miss — components with no
AI-specific anatomy are outside that thesis regardless of how common they are.

### 3.4 It fails the catalog's own inclusion test

The rule is *"appears in 3+ unrelated products"* and *"every component traces back to observed
product anatomy, not speculation."* Neither component appears anywhere on the reference board —
searched `catalog.md`, `component-specs.md`, `decisions.md`, `gaps.md` for invoice / payment method
/ receipt: zero hits, which is what surfaced the gap in the first place.

[gaps.md §1](../../design-system/gaps.md) is careful that absence-from-board means *unsampled*, not
*unneeded* — the board samples creative tools. That caution is why the twenty U-items are held as
candidates rather than commitments. But it cuts the other way here: the U-items are unsampled **AI**
patterns, where the board's bias is the problem. Billing history is not unsampled AI anatomy; it is
generic account management that the board correctly excluded.

### 3.5 The market already resolved it

Most AI products deep-link to their provider's hosted customer portal rather than rebuilding it,
because the portal handles dunning, tax, proration, SCA and receipts — none of which is a UI
problem. Shipping a component that consumers will replace with a link is negative value: it costs a
build, a test suite and a doc page, and then gets deleted.

## 4. What the Billing section actually contains

Under `settings-shell`'s existing grouped nav, deep-linkable per O12:

| Row | Built from | New? |
| --- | --- | --- |
| Current plan + upgrade | M4 `pricing-table` | no |
| Add-ons | M4's add-on row (switch, not a tier) | no |
| Payment method & invoices → | A9 `entity-row` in M1's row grid, `onManageBilling` callback | no |

The third row is a settings row with a trailing chevron and a description naming where it goes
("Manage card, invoices and receipts in the billing portal"). It is a link, styled as every other
row is styled, with the destination named — consistent with A12's *"'View all' is a link, never a
button"* and with M1's *"a toggle with no description is a setting nobody changes."*

## 5. Consequences

- **Wave 10 scope is unchanged** — `M + settings-shell`, as sequenced in
  [decisions.md §5](../../design-system/decisions.md). No components added.
- **Catalog totals unchanged** — family M stays 7, registry stays 107.
- **Q7 closes as RESOLVED — will not build.**

## 6. What would reopen this

State the falsifier now, so a future reader can check it rather than re-litigate it:

Three or more unrelated AI products shipping **in-app** invoice history or card management that is
materially different from the generic SaaS form — usage-linked invoices where a line item expands
into the runs that produced it, prepaid credit-pack purchase flows, or per-model cost attribution on
the invoice itself. That would be AI-specific billing anatomy and would belong here. A third-party
portal link in three products is not that, and does not reopen it.

The credit top-up flow is the near-miss worth watching: it is a purchase, but it is a purchase at
the point of spend, which is where M2 `credits-indicator` already lives.

## 7. Doc corrections

Carried forward from the prior spec, still outstanding, still not fixed here:

- **M7 `connection-manager` has no entry in `component-specs.md`.** Present in `catalog.md`,
  `decisions.md` and `gaps.md`; family M jumps M6 → N1. Same drift class as the wave-1 primitives
  audit found in `concept-model.md`'s fan-out table.

On approval, add to `decisions.md`: Q7 resolution, and a decision row recording that generic
account-management surfaces are out of scope by principle rather than by sequencing.
