import * as React from "react";

/** Every figure on the system pages: a card surface plus a caption. Real text
 *  in DOM reading order, so a screen reader reads the figure as written. */
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
      <div className="bg-card text-card-foreground rounded-lg border p-4 sm:p-6">{children}</div>
      <figcaption className="text-muted-foreground text-sm">{caption}</figcaption>
    </figure>
  );
}
