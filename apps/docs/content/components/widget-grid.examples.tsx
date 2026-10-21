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

export function SizesFromTheFamily() {
  return (
    <div className="w-[30rem] max-w-full">
      <WidgetGrid>
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

export function EachGridNamed() {
  return (
    <div className="flex w-[30rem] max-w-full flex-col gap-4">
      <section aria-labelledby="wg-overnight" className="flex flex-col gap-2">
        <h3 id="wg-overnight" className="text-sm font-medium">
          Overnight
        </h3>
        <WidgetGrid>
          <WidgetGridItem size="small">
            <Tile title="Failed overnight" meta="2 runs" />
          </WidgetGridItem>
          <WidgetGridItem size="small">
            <Tile title="Running now" meta="3 runs" />
          </WidgetGridItem>
        </WidgetGrid>
      </section>
      <section aria-labelledby="wg-account" className="flex flex-col gap-2">
        <h3 id="wg-account" className="text-sm font-medium">
          Account
        </h3>
        <WidgetGrid>
          <WidgetGridItem size="small">
            <Tile title="Credits left" meta="1,240" />
          </WidgetGridItem>
          <WidgetGridItem size="small">
            <Tile title="Queue" meta="5 waiting" />
          </WidgetGridItem>
        </WidgetGrid>
      </section>
    </div>
  );
}

export function PaddingOnTheGrid() {
  return (
    <div className="w-[30rem] max-w-full">
      <WidgetGrid className="px-8">
        <WidgetGridItem size="small">
          <Tile title="Credits left" meta="1,240" />
        </WidgetGridItem>
        <WidgetGridItem size="small">
          <Tile title="Queue" meta="5 waiting" />
        </WidgetGridItem>
      </WidgetGrid>
    </div>
  );
}

export function ContentTallerThanTheCell() {
  return (
    <div className="w-[30rem] max-w-full">
      <WidgetGrid>
        <WidgetGridItem size="small">
          <div className="h-48 rounded-lg border bg-card p-3 text-sm text-card-foreground">
            Failed overnight
          </div>
        </WidgetGridItem>
        <WidgetGridItem size="small">
          <Tile title="Queue" meta="5 waiting" />
        </WidgetGridItem>
      </WidgetGrid>
    </div>
  );
}
