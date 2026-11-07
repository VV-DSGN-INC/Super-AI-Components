import type { Metadata } from "next";

import { ExposedSurfacesTable, OpenUIConversation, SystemPromptView } from "@/components/openui/openui-demo";

export const metadata: Metadata = {
  title: "OpenUI",
  description:
    "Registry components as an OpenUI library: recorded answers rendered through OpenUI's runtime, offline.",
};

export default function OpenUIPage() {
  return (
    <article data-slot="openui-page" className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10 sm:px-8">
      <header className="max-w-3xl space-y-4">
        <h1 data-slot="openui-page-title" className="text-3xl font-bold">
          OpenUI
        </h1>
        <p className="leading-7">
          A model that speaks OpenUI Lang writes one line per node, such as{" "}
          <code>{'board = Table(["Task", "Owner"], rows)'}</code>, and the renderer maps each line onto a
          component this site registered. The model composes typed props and never writes a class name, a
          token or CSS.
        </p>
        <p className="leading-7">
          The conversation below replays recorded answers one line at a time. No model is called. Every
          surface wraps a registry item or a vendored primitive, and its description and enums are read from{" "}
          <a href="/openui/catalog.json" className="underline underline-offset-4">
            /openui/catalog.json
          </a>
          , which is emitted from the components&apos; contract metas.
        </p>
      </header>

      <section aria-labelledby="openui-conversation-heading" className="space-y-4">
        <h2 id="openui-conversation-heading" className="text-lg font-semibold">
          Conversation
        </h2>
        <div className="overflow-hidden rounded-lg border">
          <OpenUIConversation className="h-[42rem]" />
        </div>
      </section>

      <section aria-labelledby="openui-prompt-heading" className="max-w-3xl space-y-4">
        <h2 id="openui-prompt-heading" className="text-lg font-semibold">
          System prompt
        </h2>
        <SystemPromptView />
      </section>

      <section aria-labelledby="openui-surfaces-heading" className="max-w-3xl space-y-4">
        <h2 id="openui-surfaces-heading" className="text-lg font-semibold">
          Exposed surfaces
        </h2>
        <p className="leading-7">
          Blocks, shells, dialogs, sheets, drawers, popovers and charts are never surfaces. An overlay opening
          mid-stream is a modal inside a conversation, and charts wait for a surface designed against the
          palette rules.
        </p>
        <ExposedSurfacesTable />
      </section>
    </article>
  );
}
