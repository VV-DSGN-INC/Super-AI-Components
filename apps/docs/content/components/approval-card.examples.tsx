"use client";

import { ApprovalCard } from "@/registry/super-ai/approval-card";

/**
 * Live examples for approval-card.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component,
 * so it cannot carry "use client" or JSX with handlers. Every example with a
 * callback lives here and crosses over as a zero-prop element.
 */

/** DO — all four verbs, in the fixed order, however you passed the handlers. */
export function FixedVerbOrder() {
  return (
    <ApprovalCard
      title="Send the Q3 summary to the team"
      summary="Three paragraphs drafted from last quarter's metrics."
      onSkip={() => {}}
      onRegenerate={() => {}}
      onEdit={() => {}}
      onConfirm={() => {}}
    />
  );
}

/** DO — detail behind an explicit expand, so nothing is approved unread. */
export function DetailBehindAnExpand() {
  return (
    <ApprovalCard
      title="Publish the changelog entry"
      summary="Covers the new export formats and the billing change."
      detail={
        <p>
          Billing now prorates mid-cycle upgrades. Customers on the legacy annual plan are excluded
          until their renewal date, which means roughly 400 accounts see no change this month.
        </p>
      }
      onConfirm={() => {}}
      onEdit={() => {}}
    />
  );
}

/**
 * DON'T — a summary that describes the artifact instead of stating the
 * decision. &quot;A document was generated&quot; tells you nothing about what
 * confirming would actually do.
 */
export function VagueSummary() {
  return (
    <ApprovalCard
      title="Review required"
      summary="A document was generated."
      onConfirm={() => {}}
      onSkip={() => {}}
    />
  );
}

/**
 * DON'T — resolved with no way back. Confirm and Skip are terminal, so
 * omitting `onUndo` makes a misclick permanent.
 */
export function ResolvedWithoutUndo() {
  return <ApprovalCard title="Send the Q3 summary" state="resolved" resolution="confirmed" />;
}
