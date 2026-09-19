import * as React from "react";

/** Every figure on the system pages: a hairline above and below, then a
 *  caption. That is the same device the roster and the derived list use, so the
 *  page has one way of setting a block apart, and a figure never nests a box
 *  inside a box. Real text in DOM reading order, so a screen reader reads the
 *  figure as written. */
export function FigureFrame({
  id,
  caption,
  children,
}: {
  id: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure data-slot="system-figure" data-figure={id} className="space-y-3">
      <div className="border-y py-6">{children}</div>
      <figcaption className="text-muted-foreground text-sm">{caption}</figcaption>
    </figure>
  );
}
