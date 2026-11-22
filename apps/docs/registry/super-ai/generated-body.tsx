"use client";

import { Renderer, type Library, type OpenUIError, type ParseResult } from "@openuidev/react-lang";
import { CircleAlert } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Generated Body — The body of a view written as an OpenUI program: streamed, with the last good version kept when a new one fails.
 *
 * Spec: docs/design-system/component-specs.md#r4-generated-body
 * States: streaming · rendered · failed-with-fallback · failed-without-fallback
 *
 * The component imports no surface of its own: `library` decides what a
 * program may contain. It owns no timers and no versions. The caller streams
 * `program` in, keeps the history, and hands back the last good version as
 * `fallbackProgram`.
 *
 * What counts as a failure (measured against @openuidev/react-lang 1.1.1):
 * an unknown component name does NOT null the root unless it is the root
 * itself. It lands in `result.meta.errors` (code `unknown-component`) and the
 * rest of the program still renders. A dangling reference lands in
 * `result.meta.unresolved`. A finished program is failed when any of
 * `meta.errors`, `meta.unresolved`, a missing root or a null result is set.
 * While streaming the same signals are normal (a name used before its line
 * has arrived), so nothing is judged until `streaming` is false.
 */

interface GeneratedBodyRender {
  ok: boolean;
  errors: string[];
}

interface GeneratedBodyProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** The OpenUI Lang text that has arrived so far. */
  program: string | null;
  /** The caller's `createLibrary()` result. */
  library: Library;
  /** More lines are still coming. */
  streaming?: boolean;
  /** The last version that rendered. */
  fallbackProgram?: string | null;
  /** Shows Retry on a failure when given. */
  onRetry?: () => void;
  /** Called once per finished program. */
  onRender?: (result: GeneratedBodyRender) => void;
}

const MAX_REASONS_SHOWN = 2;

// react-lang 1.x console.errors every render error unless an onError is passed.
// The parser's own errors (source "parser": unknown component, bad argument, no
// root, unreadable program) already reach `failuresOf` through meta.errors and
// show as the failed state, so those stay quiet. Anything else (a runtime or
// render error, a query error) is shown nowhere, so it is logged in the format
// 1.x would have used. Logged, not thrown: Renderer calls this from an effect,
// where a throw would take the page down. Module-level and pure.
const OWNED_SOURCE = "parser";

function formatErrors(errors: OpenUIError[]): string {
  return [
    `[openui] Rendered with ${errors.length} error${errors.length === 1 ? "" : "s"}:`,
    ...errors.map((error) => `  - ${error.source}/${error.code}: ${error.message}`),
  ].join("\n");
}

function logUnowned(errors: OpenUIError[]): void {
  const unowned = errors.filter((error) => error.source !== OWNED_SOURCE);
  if (unowned.length > 0) console.error(formatErrors(unowned));
}

// The fallback is the last version that rendered, so it owns no failures: any
// error from it is unexpected and is logged.
function logAll(errors: OpenUIError[]): void {
  if (errors.length > 0) console.error(formatErrors(errors));
}

/** Every reason a finished parse should not be shown, in words. Empty means it rendered. */
function failuresOf(result: ParseResult | null): string[] {
  if (!result) return ["Nothing in the program could be read."];
  const reasons: string[] = [];
  for (const error of result.meta.errors) {
    reasons.push(
      error.code === "unknown-component" && error.component
        ? `${error.component} is not a component this view can use.`
        : error.message,
    );
  }
  for (const name of result.meta.unresolved) {
    reasons.push(`${name} is used but never defined.`);
  }
  if (!result.root) reasons.push("The program has no root to show.");
  return [...new Set(reasons)];
}

function reasonText(errors: string[]): string {
  const shown = errors.slice(0, MAX_REASONS_SHOWN).join(" ");
  const rest = errors.length - MAX_REASONS_SHOWN;
  return rest > 0 ? `${shown} and ${rest} more.` : shown;
}

type Outcome = "empty" | "streaming" | "pending" | "rendered" | "failed";

function GeneratedBody({
  program,
  library,
  streaming = false,
  fallbackProgram = null,
  onRetry,
  onRender,
  className,
  ...props
}: GeneratedBodyProps) {
  // The parse result is stored with the program it came from. Renderer
  // reports a result from an effect, so for one commit after `program` changes
  // the stored result still belongs to the old text and must not be judged.
  const [parsed, setParsed] = React.useState<{ program: string; result: ParseResult | null } | null>(null);
  const text = program ?? "";
  const hasProgram = text.trim().length > 0;

  let outcome: Outcome;
  let errors: string[] = [];
  if (streaming) outcome = "streaming";
  else if (!hasProgram) outcome = "empty";
  else if (parsed?.program !== text) outcome = "pending";
  else {
    errors = failuresOf(parsed.result);
    outcome = errors.length > 0 ? "failed" : "rendered";
  }

  // Once per finished program. A new stream clears the memory, so the same
  // text finishing a second time (a Retry that comes back identical) reports again.
  const onRenderRef = React.useRef(onRender);
  const reported = React.useRef<string | null>(null);
  const errorKey = errors.join("\n");
  React.useEffect(() => {
    onRenderRef.current = onRender;
  });
  React.useEffect(() => {
    if (outcome === "streaming") {
      reported.current = null;
      return;
    }
    if (outcome !== "rendered" && outcome !== "failed") return;
    if (reported.current === text) return;
    reported.current = text;
    onRenderRef.current?.({ ok: outcome === "rendered", errors: errorKey ? errorKey.split("\n") : [] });
  }, [outcome, text, errorKey]);

  const failed = outcome === "failed";
  const hasFallback = (fallbackProgram ?? "").trim().length > 0;

  return (
    <div
      data-slot="generated-body"
      data-state={outcome === "pending" ? "streaming" : outcome}
      aria-busy={streaming || undefined}
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      {hasProgram && !failed ? (
        // Mounted even while the verdict is pending: Renderer is what produces
        // the parse result. Hidden until then so a broken body never paints.
        <div data-slot="generated-body-content" hidden={outcome === "pending"} className="min-w-0">
          <Renderer
            response={text}
            library={library}
            isStreaming={streaming}
            onError={logUnowned}
            onParseResult={(result) => setParsed({ program: text, result })}
          />
        </div>
      ) : null}

      {failed ? (
        <>
          <Alert role="status" data-slot="generated-body-failure">
            <CircleAlert aria-hidden />
            <AlertTitle>This version did not render.</AlertTitle>
            {/* text-foreground: the default description colour measured 4.49:1 here.
                wrap-anywhere: the reason can carry a model-written component name
                with no break points. The button sits inside the description, not
                in AlertAction, whose physical right-2 would not mirror in RTL. */}
            <AlertDescription className="text-foreground flex min-w-0 flex-col items-start gap-2 wrap-anywhere">
              <span data-slot="generated-body-reason">{reasonText(errors)}</span>
              {onRetry ? (
                <Button
                  data-slot="generated-body-retry"
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                >
                  Retry
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
          {hasFallback ? (
            <div data-slot="generated-body-fallback" className="flex min-w-0 flex-col gap-2">
              <p className="text-foreground text-xs font-medium">Last version that rendered</p>
              <Renderer response={fallbackProgram} library={library} onError={logAll} />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export { GeneratedBody };
export type { GeneratedBodyProps, GeneratedBodyRender };
