import type { Metadata } from "next";

import { CopilotKitDemo } from "@/components/copilotkit/copilotkit-demo";

export const metadata: Metadata = {
  title: "AG-UI chat with CopilotKit",
  description:
    "The registry's chat shell, permission prompt and agent presence driven over the AG-UI protocol through CopilotKit's headless hooks.",
  robots: { index: false },
};

export default function CopilotKitPage() {
  return (
    <article data-slot="copilotkit-page" className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-8">
      <header className="max-w-3xl space-y-4">
        <h1 data-slot="copilotkit-page-title" className="text-3xl font-bold">
          AG-UI chat with CopilotKit
        </h1>
        <p className="leading-7">
          The same fixture workspace as the generated chat, reached over the AG-UI protocol. An agent on the
          server streams AG-UI events through CopilotKit&apos;s runtime, CopilotKit&apos;s headless hooks hold
          the conversation in the browser, and the <code>ag-ui-chat</code> lib item turns those messages into
          props for registry components. None of CopilotKit&apos;s own chat UI is on this page.
        </p>
        <p className="leading-7">
          The agent is scripted, so no model is called and nothing is spent. Ask what failed overnight: it
          reads the runs, then stops and asks before the retry that spends credits. Allow it, deny it, or edit
          the list of runs first. Always allow approves this one call only, because this demo has nowhere to
          keep a standing grant.
        </p>
      </header>

      <section aria-labelledby="copilotkit-demo-heading" className="space-y-4">
        <h2 id="copilotkit-demo-heading" className="sr-only">
          Conversation
        </h2>
        <CopilotKitDemo className="h-[46rem]" />
      </section>
    </article>
  );
}
