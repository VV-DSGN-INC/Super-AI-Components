import type { Metadata } from "next";

import { GeneratedChatDemo } from "@/components/generated-chat/generated-chat-demo";
import { modelFromEnv } from "@/components/generated-chat/server/model-from-env";

export const metadata: Metadata = {
  title: "Generated chat",
  description:
    "A chat whose replies are registry components: run lists, a question before anything that spends credits, widgets and saved views.",
};

export default function GeneratedChatPage() {
  // The same kill switch the chat route reads: without it the page says, and
  // stays, scripted.
  const model = modelFromEnv(process.env.GENERATED_CHAT_MODEL) !== null;
  return (
    <article
      data-slot="generated-chat-page"
      className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-8"
    >
      <header className="max-w-3xl space-y-4">
        <h1 data-slot="generated-chat-page-title" className="text-3xl font-bold">
          Generated chat
        </h1>
        <p className="leading-7">
          Each reply below is a list of AI SDK message parts: text, plus typed data parts for a card, a row of
          widgets, a question asked before anything that spends credits, and a saved view. One renderer draws
          them from this registry, so a scripted reply and a model&apos;s reply look the same.
        </p>
        {model ? (
          <p className="leading-7">
            The workspace is a fixture: runs, credits and spend for a small team, fixed at Tuesday 20 October
            2026, 09:00. Chips and the ready prompts play scripted replies. Anything else you type goes to a
            model through Vercel AI Gateway, which answers with the same parts through three read-only tools.
          </p>
        ) : (
          <p className="leading-7">
            The replies are scripted and the workspace is a fixture: runs, credits and spend for a small team,
            fixed at Tuesday 20 October 2026, 09:00. No model is called. Ask what failed overnight, then
            follow the chips.
          </p>
        )}
      </header>

      <section aria-labelledby="generated-chat-demo-heading" className="space-y-4">
        <h2 id="generated-chat-demo-heading" className="sr-only">
          Conversation
        </h2>
        <GeneratedChatDemo className="h-[46rem]" model={model} />
      </section>
    </article>
  );
}
