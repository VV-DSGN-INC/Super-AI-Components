"use client";

import { useState } from "react";

import { FrameStrip, type FrameStripItem, type FrameStripMarks } from "@/registry/super-ai/frame-strip";

const FRAMES: FrameStripItem[] = ["00:00:00", "00:00:04", "00:00:08", "00:00:12", "00:00:16"].map(
  (timecode, index) => ({
    id: `f${index + 1}`,
    label: timecode,
    thumbnail: (
      <img src={`https://placehold.co/320x180?text=${index + 1}`} alt="" className="h-full w-full object-cover" />
    ),
  }),
);

const PAGES: FrameStripItem[] = ["Title", "Problem", "Approach", "Results"].map((name, index) => ({
  id: `p${index + 1}`,
  label: `${index + 1}. ${name}`,
  thumbnail: (
    <img src={`https://placehold.co/320x180?text=${name}`} alt="" className="h-full w-full object-cover" />
  ),
}));

function useOrderedItems(initial: FrameStripItem[]) {
  const [items, setItems] = useState(initial);

  const reorder = (id: string, direction: "left" | "right") => {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const swapWith = direction === "left" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= current.length) return current;
      const next = [...current];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  };

  return { items, reorder };
}

export default function FrameStripDemo() {
  const [frame, setFrame] = useState("f2");
  const [page, setPage] = useState("p1");
  const [marks, setMarks] = useState<FrameStripMarks>({ inPoint: "f2", outPoint: "f4" });
  const pages = useOrderedItems(PAGES);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Video frames</p>
        <FrameStrip kind="video" items={FRAMES} value={frame} onValueChange={setFrame} />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Slide pages</p>
        <FrameStrip kind="slides" items={pages.items} value={page} onValueChange={setPage} onAdd={() => {}} />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">In / out picker</p>
        <FrameStrip
          kind="video"
          variant="in-out"
          items={FRAMES}
          inPoint={marks.inPoint}
          outPoint={marks.outPoint}
          onInOutChange={setMarks}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Reorder</p>
        <FrameStrip
          kind="slides"
          items={pages.items}
          value={page}
          onValueChange={setPage}
          onReorder={pages.reorder}
          onAdd={() => {}}
        />
      </div>
    </div>
  );
}
