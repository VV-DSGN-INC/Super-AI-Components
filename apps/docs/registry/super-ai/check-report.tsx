import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Channel = "app" | "push" | "chat" | "email" | "phone" | "sms";
type CheckRule =
  | "kind-on-list"
  | "slots-filled"
  | "one-ask"
  | "no-number-in-ask"
  | "fits-channel"
  | "glossary"
  | "no-guilt"
  | "readability";

// `section` already carries an RDFa `results?: number` attribute, so it is omitted to let our own
// `results` through. The prop's shape for a caller is exactly the planned one.
interface CheckReportProps extends Omit<React.ComponentProps<"section">, "results"> {
  results: { rule: CheckRule; pass: boolean; detail?: string }[];
  /** True when a failed check sent the same-kind template instead of the text as written. */
  fallback?: boolean;
  channel?: Channel;
}

/** The union's order, which is the order the report reads in. */
const RULES: { rule: CheckRule; label: string }[] = [
  { rule: "kind-on-list", label: "Kind on the list" },
  { rule: "slots-filled", label: "Slots filled" },
  { rule: "one-ask", label: "One ask" },
  { rule: "no-number-in-ask", label: "No number in the ask" },
  { rule: "fits-channel", label: "Fits the channel" },
  { rule: "glossary", label: "Glossary words" },
  { rule: "no-guilt", label: "No guilt" },
  { rule: "readability", label: "Readability" },
];

/**
 * The output checks' verdict per rule, with the fallback stated.
 *
 * Spec: docs/design-system/component-specs.md#s3-check-report
 * States: all-pass · some-fail
 */
function CheckReport({ results, fallback, channel, className, ...props }: CheckReportProps) {
  const heading = channel ? `Output checks for ${channel}` : "Output checks";
  // Rules that were switched off have no result and no row; a rule that ran always has one.
  const rows = RULES.flatMap(({ rule, label }) => {
    const result = results.find((r) => r.rule === rule);
    return result ? [{ ...result, label }] : [];
  });
  return (
    <section
      data-slot="check-report"
      aria-label={heading}
      className={cn("flex w-full min-w-0 flex-col gap-2 text-sm text-foreground", className)}
      {...props}
    >
      <ul className="flex min-w-0 list-none flex-col p-0">
        {rows.map((row) => (
          <li
            key={row.rule}
            data-slot="check-report-rule"
            className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border py-1.5 last:border-b-0"
          >
            {/* The verdict is a word. Solid for fail and outlined for pass is emphasis, never the signal. */}
            <Badge variant={row.pass ? "outline" : "default"} data-slot="check-report-verdict">
              {row.pass ? "pass" : "fail"}
            </Badge>
            <span className="font-medium">{row.label}</span>
            {row.detail && <span className="min-w-0 break-words">{row.detail}</span>}
          </li>
        ))}
      </ul>
      {fallback && (
        <p data-slot="check-report-fallback" className="font-medium">
          Sent the template instead
        </p>
      )}
    </section>
  );
}

export { CheckReport };
export type { Channel, CheckReportProps, CheckRule };
