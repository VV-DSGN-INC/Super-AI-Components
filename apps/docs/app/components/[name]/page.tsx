import { notFound } from "next/navigation";

import ChoiceChipsDemo from "@/components/demos/choice-chips-demo";
import CostChipDemo from "@/components/demos/cost-chip-demo";
import DateSectionDemo from "@/components/demos/date-section-demo";
import FieldRowDemo from "@/components/demos/field-row-demo";
import FilterBarDemo from "@/components/demos/filter-bar-demo";
import { AiNodeDemo } from "@/components/demos/flow/ai-node-demo";
import ConnectionHintDemo from "@/components/demos/flow/connection-hint-demo";
import { MediaSlotDemo } from "@/components/demos/flow/media-slot-demo";
import ModelBarDemo from "@/components/demos/flow/model-bar-demo";
import NodePromptDemo from "@/components/demos/flow/node-prompt-demo";
import { NodeStatusDemo } from "@/components/demos/flow/node-status-demo";
import PortChipDemo from "@/components/demos/flow/port-chip-demo";
import { RunButtonDemo } from "@/components/demos/flow/run-button-demo";
import TypedEdgeDemo from "@/components/demos/flow/typed-edge-demo";
import TypedHandleDemo from "@/components/demos/flow/typed-handle-demo";
import GenSettingsBarDemo from "@/components/demos/gen-settings-bar-demo";
import KbdDemo from "@/components/demos/kbd-demo";
import ShortcutsSheetDemo from "@/components/demos/shortcuts-sheet-demo";
import ThreadListDemo from "@/components/demos/thread-list-demo";
import { CATALOG, FLOW_CATALOG, FLOW_NOTES, type CatalogName, type FlowCatalogName } from "@/lib/catalog";

const demos: Record<CatalogName, React.ComponentType> = {
  kbd: KbdDemo,
  "cost-chip": CostChipDemo,
  "date-section": DateSectionDemo,
  "choice-chips": ChoiceChipsDemo,
  "filter-bar": FilterBarDemo,
  "field-row": FieldRowDemo,
  "gen-settings-bar": GenSettingsBarDemo,
  "shortcuts-sheet": ShortcutsSheetDemo,
  "thread-list": ThreadListDemo,
};

/* Flow Kit demos — flow-types and use-flow-runner are doc-only (code snippet instead). */
const flowDemos: Partial<Record<FlowCatalogName, React.ComponentType>> = {
  "typed-handle": TypedHandleDemo,
  "typed-edge": TypedEdgeDemo,
  "port-chip": PortChipDemo,
  "connection-hint": ConnectionHintDemo,
  "node-status": NodeStatusDemo,
  "ai-node": AiNodeDemo,
  "media-slot": MediaSlotDemo,
  "run-button": RunButtonDemo,
  "model-bar": ModelBarDemo,
  "node-prompt": NodePromptDemo,
};

const flowSnippets: Partial<Record<FlowCatalogName, string>> = {
  "flow-types": `import {
  FLOW_STATUSES,
  getHandleType,
  handleId,
  isValidFlowConnection,
  registerHandleType,
  type FlowStatus,
} from "@/components/super-ai/flow/flow-types";

// Built-in handle types: text · image · video · audio (colored via --flow-* tokens).
// Register custom types at module scope; add a --flow-style token to your CSS.
registerHandleType("style", { label: "Style" });
getHandleType("style"); // { label: "Style", cssVar: "--flow-style" }

// Handle-id codec: {nodeId}:{dataType}:{in|out}
handleId("node-1", "image", "out"); // "node-1:image:out"

// Connections must be same-type and out→in.
isValidFlowConnection({
  sourceHandle: "a:image:out",
  targetHandle: "b:image:in",
}); // true

// The six-state generation contract used across the kit:
FLOW_STATUSES; // ["idle", "queued", "streaming", "done", "failed", "locked"]`,
  "use-flow-runner": `import { useFlowRunner } from "@/components/super-ai/flow/use-flow-runner";

const runner = useFlowRunner({
  nodes, // [{ id, data }] — data must be JSON-serializable (content-hashed)
  edges, // [{ id, source, target }]
  // Honor \`signal\`; the resolved output feeds downstream cache keys.
  execute: async (node, inputs, signal) => ({ url: await generate(node, inputs, signal) }),
  onStatus: (id, status) => {}, // idle | queued | streaming | done | failed | locked
});

runner.run(); // full topological run — clean nodes are cache hits
runner.runNode(id); // just this node (dirties it first)
runner.runFrom(id); // this node + everything downstream
runner.runSelection(ids); // an explicit scope
runner.markDirty(id); // force id + downstream to re-execute next run
runner.stop(); // abort in-flight execute()s; queued nodes reset to idle
runner.reset(); // clear cache, dirty marks, statuses, errors, outputs

runner.statuses; // Record<nodeId, FlowStatus> — drive node/edge visuals
runner.outputs; // Record<nodeId, NodeOutput> — e.g. media URLs
runner.errors; // Record<nodeId, Error> — failed branches only`,
};

export function generateStaticParams() {
  return [...CATALOG, ...FLOW_CATALOG].map((name) => ({ name }));
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const isWave0 = CATALOG.includes(name as CatalogName);
  const isFlow = FLOW_CATALOG.includes(name as FlowCatalogName);
  if (!isWave0 && !isFlow) notFound();
  const Demo = isWave0 ? demos[name as CatalogName] : flowDemos[name as FlowCatalogName];
  const note = isFlow ? FLOW_NOTES[name as FlowCatalogName] : undefined;
  const snippet = isFlow ? flowSnippets[name as FlowCatalogName] : undefined;
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <h1 className="text-2xl font-bold">{name}</h1>
      {note && <p className="text-muted-foreground text-sm">{note}</p>}
      {Demo && (
        <div className="flex min-h-40 items-center justify-center rounded-xl border p-8">
          <Demo />
        </div>
      )}
      {snippet && (
        <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
          <code>{snippet}</code>
        </pre>
      )}
      <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
        <code>{`npx shadcn@latest add https://super-ai-components.vercel.app/r/${name}.json`}</code>
      </pre>
    </main>
  );
}
