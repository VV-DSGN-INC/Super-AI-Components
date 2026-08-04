"use client";

import * as React from "react";

import { GenerationQueue, type GenerationQueueItem } from "@/registry/super-ai/generation-queue";

const INITIAL_ITEMS: GenerationQueueItem[] = [
  { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "done" },
  { id: "2", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "running", progress: 62 },
  { id: "3", title: "Studio portrait, soft light", description: "Image · 1:1", state: "queued" },
  {
    id: "4",
    title: "Glass sculpture on marble",
    description: "Image · 1:1",
    state: "failed",
    errorMessage: "Generation timed out",
  },
];

export default function GenerationQueueDemo() {
  const [items, setItems] = React.useState<GenerationQueueItem[]>(INITIAL_ITEMS);

  const handleCancelItem = (id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, state: "cancel" } : item)));
  };

  const handleCancelAll = (ids: string[]) => {
    setItems((current) => current.map((item) => (ids.includes(item.id) ? { ...item, state: "cancel" } : item)));
  };

  const handleRetryItem = (id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, state: "queued" } : item)));
  };

  return (
    <GenerationQueue
      items={items}
      heading="Generating 4 images"
      onCancelItem={handleCancelItem}
      onCancelAll={handleCancelAll}
      onRetryItem={handleRetryItem}
    />
  );
}
