"use client";

import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import * as React from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Browser Frame — a page we visited, not our UI.
 *
 * Spec: docs/design-system/component-specs.md#q1-browser-frame
 * States: page · minimal · inverted · long-address · loading
 *
 * Read from Vercel's Geist (D20), where the job is marketing decoration around
 * a screenshot. The job here is narrower: framing what an agent saw — a
 * browsing step, a computer-use capture, a fetched page rendered as a tool
 * result — so the capture reads as external content rather than as the
 * product's own surface.
 *
 * That difference in job is why this diverges from Geist on the one point that
 * matters. Geist marks the whole chrome `aria-hidden`, which is right when the
 * URL is illustrative. Here the URL is real data — it is the record of where
 * the agent went — so **the address stays in the accessibility tree** and only
 * the genuinely decorative parts (dots, controls) are hidden.
 */

type BrowserFrameTone = "surface" | "inverted";

/**
 * A final path segment longer than this is not pinned. Pinning it would hold
 * the whole string at full width and defeat the truncation entirely, which is
 * the failure mode the pin exists to avoid.
 */
const MAX_PINNED_TAIL = 24;

const TONE: Record<
  BrowserFrameTone,
  { chrome: string; dot: string; glyph: string; field: string; address: string }
> = {
  surface: {
    chrome: "bg-muted",
    dot: "bg-border",
    glyph: "text-foreground/70",
    field: "bg-background",
    // Never `text-muted-foreground`: the bar paints `bg-muted`, and that pair
    // measures 4.34:1 against a 4.5 minimum. No variable rebind is needed here
    // (the rebind idiom exists for *composed children* carrying their own
    // muted classes, and this bar composes nothing) — the address is simply
    // full-contrast, which is also what a real address bar looks like.
    address: "text-foreground",
  },
  inverted: {
    chrome: "bg-foreground",
    dot: "bg-background/30",
    glyph: "text-background/70",
    field: "bg-background/10",
    address: "text-background",
  },
};

/**
 * Middle truncation, split for CSS rather than measured in JS.
 *
 * The head keeps the host and elides from its *end* under `truncate`; the
 * final path segment is pinned as a non-shrinking sibling. So a long URL loses
 * its middle — the part that says least — instead of its tail. A trailing
 * ellipsis would hide the path, which for a browsing preview is the half that
 * says what was actually looked at.
 */
function splitAddress(address: string): [head: string, tail: string] {
  const schemeEnd = address.indexOf("//");
  const pathStart = address.indexOf("/", schemeEnd >= 0 ? schemeEnd + 2 : 0);
  // Host only. There is no path, so there is nothing worth pinning.
  if (pathStart < 0) return [address, ""];

  const cut = address.lastIndexOf("/");
  // The only slash is the one opening the path, or the string ends on a slash:
  // either way the tail would be empty or the whole path.
  if (cut <= pathStart || cut === address.length - 1) return [address, ""];

  const tail = address.slice(cut);
  return tail.length > MAX_PINNED_TAIL ? [address, ""] : [address.slice(0, cut), tail];
}

interface BrowserFrameProps extends React.ComponentProps<"div"> {
  /** The URL shown in the address bar. Omit for a frame with no address. */
  address?: string;
  /** `inverted` gives dark chrome against a light page, and the reverse in dark mode. */
  tone?: BrowserFrameTone;
  /** Back / forward / reload glyphs. Decorative — they depict a browser, they do not drive one. */
  controls?: boolean;
  /** Window dots. Monochrome here: this token set has no honest value for "macOS yellow". */
  dots?: boolean;
  /**
   * Aspect ratio of the content well, always locked. A well that is not locked reflows
   * the page when a screenshot finishes decoding, which is the failure this
   * component exists to prevent in a results grid.
   */
  ratio?: number;
  /** Swaps the content well for a skeleton at the same ratio, so nothing moves when it resolves. */
  loading?: boolean;
}

function BrowserFrame({
  address,
  tone = "surface",
  controls = true,
  dots = true,
  ratio = 16 / 9,
  loading = false,
  className,
  children,
  ...props
}: BrowserFrameProps) {
  const t = TONE[tone];
  const [head, tail] = splitAddress(address ?? "");
  // With every chrome element off, an empty bar is a stripe of noise. Drop it
  // and the component is a plain locked well, which is the honest rendering.
  const hasChrome = dots || controls || Boolean(address);

  return (
    <div data-slot="browser-frame" className={cn("overflow-hidden rounded-lg border", className)} {...props}>
      {hasChrome ? (
        <div
          data-slot="browser-frame-chrome"
          className={cn("flex items-center gap-3 border-b px-3 py-2", t.chrome)}
        >
          {dots ? (
            <div
              data-slot="browser-frame-dots"
              aria-hidden="true"
              className="flex shrink-0 items-center gap-1.5"
            >
              <span className={cn("size-2.5 rounded-full", t.dot)} />
              <span className={cn("size-2.5 rounded-full", t.dot)} />
              <span className={cn("size-2.5 rounded-full", t.dot)} />
            </div>
          ) : null}

          {controls ? (
            <div
              data-slot="browser-frame-controls"
              aria-hidden="true"
              className={cn("flex shrink-0 items-center gap-1.5", t.glyph)}
            >
              {/* Back and forward are directional, so they mirror under RTL; reload is not. */}
              <ArrowLeft className="size-3.5 rtl:-scale-x-100" />
              <ArrowRight className="size-3.5 rtl:-scale-x-100" />
              <RotateCw className="size-3.5" />
            </div>
          ) : null}

          {address ? (
            <div
              data-slot="browser-frame-address"
              className={cn(
                "flex min-w-0 flex-1 items-center rounded-md px-2 py-0.5 font-mono text-xs",
                t.field,
              )}
            >
              {/*
                The two visual halves are hidden and the complete address is
                given once, in one node. Left visible, accname would fuse the
                halves with no separator — the "Inpoint at 3s" failure the
                build brief records — and any future gap or separator between
                them would land in the announced string.
              */}
              <span className={cn("sr-only", t.address)}>{address}</span>
              <span aria-hidden="true" className={cn("truncate", t.address)}>
                {head}
              </span>
              {tail ? (
                <span aria-hidden="true" className={cn("shrink-0 whitespace-pre", t.address)}>
                  {tail}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div data-slot="browser-frame-content" className="bg-background">
        <AspectRatio ratio={ratio}>
          {loading ? (
            <Skeleton className="absolute inset-0 rounded-none motion-reduce:animate-none" />
          ) : (
            <div className="absolute inset-0 overflow-hidden">{children}</div>
          )}
        </AspectRatio>
      </div>
    </div>
  );
}

export { BrowserFrame, type BrowserFrameProps, type BrowserFrameTone };
