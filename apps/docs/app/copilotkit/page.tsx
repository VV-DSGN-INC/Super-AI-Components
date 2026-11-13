import type { Metadata } from "next";

import { CopilotKitDemo } from "@/components/copilotkit-spike/copilotkit-demo";

export const metadata: Metadata = {
  title: "CopilotKit runtime (spike)",
  description:
    "The registry's chat shell, permission prompt and agent presence driven by an AG-UI agent through CopilotKit's headless hooks.",
  robots: { index: false },
};

export default function CopilotKitSpikePage() {
  return (
    <article
      data-slot="copilotkit-spike-page"
      className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-8"
    >
      <header className="max-w-3xl space-y-4">
        <h1 data-slot="copilotkit-spike-page-title" className="text-3xl font-bold">
          CopilotKit runtime (spike)
        </h1>
        <p className="leading-7">
          The same fixture workspace as the generated chat, reached a different way. An agent on the server
          speaks AG-UI events through CopilotKit&apos;s runtime; CopilotKit&apos;s headless hooks hold the
          conversation in the browser; registry components draw all of it. None of CopilotKit&apos;s own chat
          UI is on this page.
        </p>
        <p className="leading-7">
          The agent is scripted, so no model is called and nothing is spent. Ask what failed overnight: it
          reads the runs, then stops and asks before the retry that spends credits. Allow it, deny it, or edit
          the list of runs first.
        </p>
      </header>

      <section aria-labelledby="copilotkit-spike-demo-heading" className="space-y-4">
        <h2 id="copilotkit-spike-demo-heading" className="sr-only">
          Conversation
        </h2>
        <CopilotKitDemo className="h-[46rem]" />
      </section>
    </article>
  );
}
