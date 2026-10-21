"use client";

import { WidgetGrid, WidgetGridItem } from "@/registry/super-ai/widget-grid";

function Tile({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex flex-col gap-1 overflow-hidden rounded-lg border bg-card p-3 text-card-foreground">
      <span className="text-sm font-medium">{title}</span>
      <span className="text-sm text-muted-foreground">{meta}</span>
    </div>
  );
}

/** Resize the preview: below 43.5rem of its own width the grid is two columns, from there four. */
export default function WidgetGridDemo() {
  return (
    <div className="w-[46rem] max-w-full">
      <WidgetGrid role="region" aria-label="Overnight runs">
        <WidgetGridItem size="large">
          <Tile title="Running now" meta="3 runs" />
        </WidgetGridItem>
        <WidgetGridItem size="small">
          <Tile title="Credits left" meta="1,240" />
        </WidgetGridItem>
        <WidgetGridItem size="small">
          <Tile title="Failed overnight" meta="2 runs" />
        </WidgetGridItem>
        <WidgetGridItem size="medium">
          <Tile title="Queue" meta="5 waiting" />
        </WidgetGridItem>
      </WidgetGrid>
    </div>
  );
}
