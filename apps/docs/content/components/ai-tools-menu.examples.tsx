"use client";

import { AiToolsMenu, type AiToolGroup } from "@/registry/super-ai/ai-tools-menu";

/**
 * Live examples for ai-tools-menu.docs.tsx. A client sidecar: the docs module
 * is plain data read by a Server Component and cannot carry handlers.
 */

const EDIT: AiToolGroup = {
  id: "edit",
  label: "Edit this image",
  actions: [
    { id: "remove-bg", title: "Remove background", description: "Cut the subject out" },
    { id: "expand", title: "Magic expand", description: "Paint beyond the frame", cost: { amount: 17 } },
  ],
};

const GENERATE: AiToolGroup = {
  id: "generate",
  label: "Generate from it",
  actions: [{ id: "variations", title: "Variations", cost: { amount: 55 } }],
};

const CAREFUL: AiToolGroup = {
  id: "careful",
  label: "Costly or irreversible",
  destructive: true,
  actions: [
    { id: "regenerate", title: "Regenerate from scratch", description: "Discards every edit", cost: { amount: 2400 } },
    { id: "clear", title: "Clear the layer", description: "Cannot be undone" },
  ],
};

const SELECTION = { label: "Hero shot, layer 3", type: "Image" };

/** Strips the prices, for the don&apos;t below. */
const unpriced = (actions: AiToolGroup["actions"]): AiToolGroup["actions"] =>
  actions.map((action) => ({ ...action, cost: undefined }));

const FRAME = "rounded-lg border p-1";

/** DO — name the object the actions will run against. */
export function SelectionNamed() {
  return (
    <AiToolsMenu
      presentation="inline"
      selection={SELECTION}
      groups={[EDIT, GENERATE]}
      onAction={() => {}}
      className={FRAME}
    />
  );
}

/** DO — expensive and irreversible work grouped below its own rule. */
export function CarefulWorkBelowTheRule() {
  return (
    <AiToolsMenu
      presentation="inline"
      selection={SELECTION}
      groups={[EDIT, CAREFUL]}
      onAction={() => {}}
      className={FRAME}
    />
  );
}

/**
 * DON&apos;T — one undifferentiated list. Nothing says what these run against,
 * and Clear the layer sits one row below Magic expand with no warning at all.
 */
export function OneFlatList() {
  return (
    <AiToolsMenu
      presentation="inline"
      groups={[
        {
          id: "all",
          actions: [...EDIT.actions, ...GENERATE.actions, ...CAREFUL.actions],
        },
      ]}
      onAction={() => {}}
      className={FRAME}
    />
  );
}

/**
 * DON&apos;T — a menu with no prices. Regenerate from scratch bills 2,400
 * credits and reads exactly like the free rows above it.
 */
export function NoPrices() {
  return (
    <AiToolsMenu
      presentation="inline"
      selection={SELECTION}
      groups={[
        { id: "edit", label: "Edit this image", actions: unpriced(EDIT.actions) },
        {
          id: "careful",
          label: "Costly or irreversible",
          destructive: true,
          actions: unpriced(CAREFUL.actions),
        },
      ]}
      onAction={() => {}}
      className={FRAME}
    />
  );
}
