"use client";

import { useState } from "react";

import { ReferenceStrip, type ReferenceStripItem, type ReferenceRole } from "@/registry/super-ai/reference-strip";

interface DemoItem {
  id: string;
  role?: ReferenceRole;
  thumbnail?: { src: string; alt: string };
}

const FILLED_ITEMS: DemoItem[] = [
  { id: "one", thumbnail: { src: "https://placehold.co/200x200?text=1", alt: "Concept sketch of a lighthouse" } },
  { id: "two", thumbnail: { src: "https://placehold.co/200x200?text=2", alt: "Photo of a coastline at dusk" } },
  { id: "three", thumbnail: { src: "https://placehold.co/200x200?text=3", alt: "Reference of a rope texture" } },
];

const ROLE_ITEMS: DemoItem[] = [
  {
    id: "first-frame",
    role: "first-frame",
    thumbnail: { src: "https://placehold.co/200x200?text=First", alt: "First frame of the shot" },
  },
  { id: "last-frame", role: "last-frame" }, // empty typed slot — stays visible rather than collapsing
  {
    id: "character",
    role: "character",
    thumbnail: { src: "https://placehold.co/200x200?text=Char", alt: "Reference of the main character" },
  },
];

function useReorderableItems(initial: DemoItem[]) {
  const [items, setItems] = useState(initial);

  const move = (id: string, direction: "left" | "right") => {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const swapWith = direction === "left" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= current.length) return current;
      const next = [...current];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  };

  const remove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const fill = (role?: ReferenceRole) => {
    setItems((current) =>
      current.map((item) =>
        item.role === role && !item.thumbnail
          ? { ...item, thumbnail: { src: "https://placehold.co/200x200?text=Added", alt: `Added ${role}` } }
          : item,
      ),
    );
  };

  const toStripItems = (): ReferenceStripItem[] =>
    items.map((item) => ({ ...item, onRemove: () => remove(item.id) }));

  return { items: toStripItems(), move, fill };
}

export default function ReferenceStripDemo() {
  const filled = useReorderableItems(FILLED_ITEMS);
  const withRoles = useReorderableItems(ROLE_ITEMS);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Empty</p>
        <ReferenceStrip items={[]} onAdd={() => {}} />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Filled</p>
        <ReferenceStrip items={filled.items} onAdd={() => {}} onMove={filled.move} />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">With roles</p>
        <ReferenceStrip items={withRoles.items} onAdd={withRoles.fill} onMove={withRoles.move} />
      </div>
    </div>
  );
}
