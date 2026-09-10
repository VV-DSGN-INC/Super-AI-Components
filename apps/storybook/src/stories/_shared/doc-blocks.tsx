import * as React from "react";
import { Unstyled } from "@storybook/addon-docs/blocks";

import { cn } from "@/lib/utils";

type ExampleProps = React.ComponentProps<"div">;

/** Frame for every live example on a guidance page. MDX-inline JSX bypasses
 *  the preview decorator that frames stories, so without this the example
 *  sits on the docs page's own background and breaks in dark mode.
 *  `Unstyled` opts out of the docs typography so the kit's styles apply. */
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

type DoDontProps = React.ComponentProps<"div"> & {
  doExample: React.ReactNode;
  doCaption: string;
  dontExample: React.ReactNode;
  dontCaption: string;
};

/** Side-by-side Do and Don't. Both captions are required: a pair without a
 *  stated reason is decoration. The borders are the `primary` and
 *  `destructive` pair `apps/docs/components/component-docs.tsx` already uses
 *  for per-component guidance, so the two surfaces read the same. */
function DoDont({ doExample, doCaption, dontExample, dontCaption, className, ...props }: DoDontProps) {
  return (
    <Unstyled>
      <div
        data-slot="doc-do-dont"
        className={cn("my-4 grid gap-4 font-sans sm:grid-cols-2", className)}
        {...props}
      >
        <figure className="m-0">
          <div className="bg-background text-foreground border-primary/40 overflow-x-auto rounded-xl border-2 p-6">
            {doExample}
          </div>
          <figcaption className="text-foreground mt-2 text-sm">
            <span className="font-semibold">Do</span>{" "}
            <span className="text-muted-foreground">{doCaption}</span>
          </figcaption>
        </figure>
        <figure className="m-0">
          <div className="bg-background text-foreground border-destructive/40 overflow-x-auto rounded-xl border-2 p-6">
            {dontExample}
          </div>
          <figcaption className="text-foreground mt-2 text-sm">
            <span className="font-semibold">Don&apos;t</span>{" "}
            <span className="text-muted-foreground">{dontCaption}</span>
          </figcaption>
        </figure>
      </div>
    </Unstyled>
  );
}

export { Example, DoDont };
export type { ExampleProps, DoDontProps };
