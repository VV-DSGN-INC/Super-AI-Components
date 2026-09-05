import * as React from "react";
import { Unstyled } from "@storybook/addon-docs/blocks";
import { CircleCheck, CircleX } from "lucide-react";

import { cn } from "@/lib/utils";

type ExampleProps = React.ComponentProps<"div">;

/** Frame for every live example on a docs page.
 *
 *  Exists because MDX-inline JSX bypasses the preview decorator that frames
 *  normal stories: without this wrapper, examples sit on the docs page's own
 *  typography and background and break in dark mode. `Unstyled` opts out of
 *  Storybook's docs styles so the token sheet applies cleanly. The frame is
 *  `bg-background`, never a tinted surface, so a specimen that carries
 *  `text-muted-foreground` is measured against the page it would really sit
 *  on rather than against the 4.34:1 trap `a11y-baseline.md` records. */
function Example({ className, ...props }: ExampleProps) {
  return (
    <Unstyled>
      <div
        data-slot="doc-example"
        className={cn(
          "bg-background text-foreground border-border my-4 rounded-xl border p-6 font-sans",
          className,
        )}
        {...props}
      />
    </Unstyled>
  );
}

/** The palette is monochrome plus destructive (Foundations → Color), so the
 *  "Do" verdict is ink and the "Don't" verdict is the one red the system has.
 *  A green status colour would be a token this sheet does not carry. */
const VERDICT = {
  do: { word: "Do", mark: CircleCheck, rule: "border-t-foreground", text: "text-foreground" },
  dont: { word: "Don't", mark: CircleX, rule: "border-t-destructive", text: "text-destructive" },
} as const;

/** One side of the pair: specimen well, then a verdict separated by the 2px
 *  coloured rule. The verdict lives inside the frame rather than floating
 *  under it: a caption outside the box belongs to the page, and the eye has to
 *  re-pair it with a specimen on every read. */
function DoDontCard({
  kind,
  example,
  caption,
}: {
  kind: keyof typeof VERDICT;
  example: React.ReactNode;
  caption: string;
}) {
  const verdict = VERDICT[kind];
  const Mark = verdict.mark;

  return (
    <figure
      data-slot="doc-do-dont-card"
      data-kind={kind}
      className={cn(
        "border-border bg-card m-0 grid grid-rows-[1fr_auto] overflow-hidden rounded-xl border",
        // Spans the pair's two shared rows so both specimen wells end on the
        // same line. Without it each card sizes its own rows and a taller
        // "don't" drags its verdict below its neighbour's, which reads as part
        // of the difference being demonstrated rather than as content length.
        "sm:row-span-2 sm:grid-rows-subgrid",
      )}
    >
      {/* Block flow, not a centred flex row: MDX specimens are usually whole
          components that must not shrink to their content. The well is the
          page surface on purpose (see Example above). */}
      <div className="bg-background min-h-28 overflow-x-auto p-6">{example}</div>
      <figcaption className={cn("border-t-2 px-5 py-4", verdict.rule)}>
        <p className="flex items-baseline gap-2 text-sm">
          {/* The eyebrow stays a plain inline box and the mark rides on
              vertical-align. An inline-flex span would take its baseline from
              the SVG, so the outer items-baseline row would align the sentence
              to the icon's bottom edge instead of to the word. Preflight sets
              svg{display:block}, so `inline` is what makes this work. */}
          <span
            className={cn("text-xs font-semibold tracking-wide whitespace-nowrap uppercase", verdict.text)}
          >
            <Mark aria-hidden className="mr-1.5 inline size-4 align-[-0.3em]" />
            {verdict.word}
          </span>
          <span className="text-muted-foreground">{caption}</span>
        </p>
      </figcaption>
    </figure>
  );
}

type DoDontProps = React.ComponentProps<"div"> & {
  doExample: React.ReactNode;
  doCaption: string;
  dontExample: React.ReactNode;
  dontCaption: string;
};

/** Side-by-side Do/Don't pair. Captions are required: a Do/Don't without a
 *  stated reason is decoration, not guidance. This is the Storybook MDX tier's
 *  own pair; the docs site renders its `dos`/`donts` from each component's
 *  docs module through apps/docs/components/component-docs.tsx. */
function DoDont({ doExample, doCaption, dontExample, dontCaption, className, ...props }: DoDontProps) {
  return (
    <Unstyled>
      <div
        data-slot="doc-do-dont"
        className={cn(
          "text-foreground my-4 grid gap-4 font-sans",
          // Two shared rows, specimen then verdict, that both cards span.
          // Stacked (below `sm`) has no neighbour to align against, so the
          // rows are per-card there and must not be forced.
          "sm:grid-cols-2 sm:grid-rows-[1fr_auto]",
          className,
        )}
        {...props}
      >
        <DoDontCard kind="do" example={doExample} caption={doCaption} />
        <DoDontCard kind="dont" example={dontExample} caption={dontCaption} />
      </div>
    </Unstyled>
  );
}

export { Example, DoDont };
export type { ExampleProps, DoDontProps };
