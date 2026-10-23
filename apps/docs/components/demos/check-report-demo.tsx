"use client";

import { CheckReport, type CheckRule } from "@/registry/super-ai/check-report";

const RULES: CheckRule[] = [
  "kind-on-list",
  "slots-filled",
  "one-ask",
  "no-number-in-ask",
  "fits-channel",
  "glossary",
  "no-guilt",
  "readability",
];

// Live text for chat that said "you missed", so the template went out instead.
const RESULTS = RULES.map((rule) =>
  rule === "no-guilt" ? { rule, pass: false, detail: 'Found "you missed"' } : { rule, pass: true },
);

export default function CheckReportDemo() {
  return (
    <div className="w-full max-w-md">
      <CheckReport results={RESULTS} channel="chat" fallback />
    </div>
  );
}
