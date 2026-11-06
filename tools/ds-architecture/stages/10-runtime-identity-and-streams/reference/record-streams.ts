/** Records the stage-10 stream fixtures through the AI SDK's own pipeline.
 *
 *  The model is scripted (MockLanguageModelV3) so every run is byte-identical,
 *  but everything after the model is the real SDK: streamText runs the steps,
 *  executes the tools and serialises with toUIMessageStream, and
 *  readUIMessageStream assembles the final message. The chunk sequences are
 *  therefore exactly what a client receives; only the words are written.
 *
 *  Run from a project that has `ai` installed (Node 22.6+ strips the types):
 *    node record-streams.ts <out-dir>
 *
 *  A target can point the same scenarios at a real provider to record its own
 *  streams; swap `scripted(...)` for the provider's model. */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

import {
  createUIMessageStream,
  dynamicTool,
  jsonSchema,
  readUIMessageStream,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
  type UIMessageChunk,
} from "ai"
import { MockLanguageModelV3, convertArrayToReadableStream } from "ai/test"

const require = createRequire(import.meta.url)
const SDK_VERSION: string = JSON.parse(
  readFileSync(require.resolve("ai/package.json"), "utf8")
).version

const usage = {
  inputTokens: { total: 12, noCache: 12, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 40, text: 32, reasoning: 8 },
}
const finish = (unified: "stop" | "tool-calls") => ({
  type: "finish" as const,
  usage,
  finishReason: { unified, raw: unified },
})

const textParts = (id: string, text: string) => [
  { type: "text-start" as const, id },
  ...text.match(/.{1,24}(\s|$)/g)!.map((delta) => ({ type: "text-delta" as const, id, delta })),
  { type: "text-end" as const, id },
]
const reasoningParts = (id: string, text: string) => [
  { type: "reasoning-start" as const, id },
  ...text.match(/.{1,24}(\s|$)/g)!.map((delta) => ({ type: "reasoning-delta" as const, id, delta })),
  { type: "reasoning-end" as const, id },
]
const toolCallParts = (id: string, toolName: string, input: object, dynamic = false) => {
  const json = JSON.stringify(input)
  return [
    { type: "tool-input-start" as const, id, toolName, ...(dynamic ? { dynamic } : {}) },
    ...json.match(/.{1,16}/g)!.map((delta) => ({ type: "tool-input-delta" as const, id, delta })),
    { type: "tool-input-end" as const, id },
    { type: "tool-call" as const, toolCallId: id, toolName, input: json, ...(dynamic ? { dynamic } : {}) },
  ]
}

/** One scripted model call per step, in order. */
function scripted(steps: unknown[][]) {
  let call = 0
  return new MockLanguageModelV3({
    doStream: async () => {
      const parts = steps[Math.min(call++, steps.length - 1)]
      return {
        stream: convertArrayToReadableStream([{ type: "stream-start", warnings: [] }, ...parts] as never),
      }
    },
  })
}

/** Real find_component output on the Minimal Design System's contracts
 *  (captured 2026-10-19 over MCP stdio), trimmed to its first result. */
const FIND_COMPONENT_RESULT =
  "1. confirmation: The model asking permission without leaving the log. Reaching for it instead of an AlertDialog is a decision about who started the act, the reader or the model.\n   Pairs with: tool\n   Instead, for the cases it rules out: alert-dialog"

const findComponent = tool({
  description: "Find the right component for a UI need",
  inputSchema: jsonSchema<{ need: string }>({
    type: "object",
    properties: { need: { type: "string" } },
    required: ["need"],
  }),
  execute: async () => FIND_COMPONENT_RESULT,
})

const findComponentFailing = tool({
  description: "Find the right component for a UI need",
  inputSchema: jsonSchema<{ need: string }>({
    type: "object",
    properties: { need: { type: "string" } },
    required: ["need"],
  }),
  // The explicit return type stops TypeScript inferring `never` as the tool's
  // output, which the overloads then reject.
  execute: async (): Promise<string> => {
    throw new Error("the contracts index could not be read")
  },
})

type Scenario = {
  id: string
  title: string
  stream: () => ReadableStream<UIMessageChunk>
}

const SCENARIOS: Scenario[] = [
  {
    id: "reasoning-and-sources",
    title: "Reasoning, then a cited answer with a URL source and a document source",
    stream: () =>
      streamText({
        model: scripted([
          [
            ...reasoningParts("rs-1", "The reader asks which tokens a button reads. The contract and the token docs both answer it."),
            { type: "source", sourceType: "url", id: "src-1", url: "https://ds.vyhouski.com/components/button", title: "Button" },
            { type: "source", sourceType: "document", id: "src-2", mediaType: "application/json", title: "button.meta.json", filename: "button.meta.json" },
            ...textParts("tx-1", "A primary button reads the accent pair through the button-primary token, and its focus ring reads border-focus-ring."),
            finish("stop"),
          ],
        ]),
        prompt: "Which tokens does the primary button read?",
      }).toUIMessageStream({ generateMessageId: () => "msg-reasoning-and-sources", sendReasoning: true, sendSources: true }),
  },
  {
    id: "tool-call-completed",
    title: "A tool call that completes, then an answer in a second step",
    stream: () =>
      streamText({
        model: scripted([
          [...toolCallParts("call-1", "find_component", { need: "ask the user to approve a destructive tool call" }), finish("tool-calls")],
          [...textParts("tx-2", "Use a Confirmation mounted beside the Tool block, and only while the call waits on a person."), finish("stop")],
        ]),
        tools: { find_component: findComponent },
        stopWhen: stepCountIs(2),
        prompt: "Which component should I use to confirm a destructive tool call?",
      }).toUIMessageStream({ generateMessageId: () => "msg-tool-call-completed" }),
  },
  {
    id: "tool-call-error",
    title: "A tool call that fails, then an answer that says so",
    stream: () =>
      streamText({
        model: scripted([
          [...toolCallParts("call-2", "find_component", { need: "ask the user to approve a destructive tool call" }), finish("tool-calls")],
          [...textParts("tx-3", "The contract search failed, so I can't point to the kit's guidance yet. Run the search again."), finish("stop")],
        ]),
        tools: { find_component: findComponentFailing },
        stopWhen: stepCountIs(2),
        prompt: "Which component should I use to confirm a destructive tool call?",
      }).toUIMessageStream({ generateMessageId: () => "msg-tool-call-error", onError: (e) => (e instanceof Error ? e.message : String(e)) }),
  },
  {
    id: "dynamic-tool-file-and-data",
    title: "A data part, a dynamic tool, a generated file and a closing answer",
    stream: () =>
      createUIMessageStream({
        generateId: () => "msg-dynamic-tool-file-and-data",
        execute: ({ writer }) => {
          writer.write({ type: "data-plan", id: "plan-1", data: { steps: ["Look up the token", "Draw the swatch"] } })
          const result = streamText({
            model: scripted([
              [...toolCallParts("call-3", "get_tokens", { component: "button" }, true), finish("tool-calls")],
              [
                { type: "file", mediaType: "image/svg+xml", data: "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPg==" },
                ...textParts("tx-4", "Here is the swatch for the primary button's fill."),
                finish("stop"),
              ],
            ]),
            tools: {
              get_tokens: dynamicTool({
                description: "Look up the tokens a component reads",
                inputSchema: jsonSchema({ type: "object", properties: { component: { type: "string" } } }),
                execute: async () => ({ tokens: ["button-primary", "text-on-accent"] }),
              }),
            },
            stopWhen: stepCountIs(2),
            prompt: "Show me the primary button's fill.",
          })
          writer.merge(result.toUIMessageStream({ sendStart: false }))
        },
      }),
  },
]

async function collect(stream: ReadableStream<UIMessageChunk>) {
  const chunks: UIMessageChunk[] = []
  for await (const chunk of stream as unknown as AsyncIterable<UIMessageChunk>) chunks.push(chunk)
  let message: UIMessage | undefined
  for await (const m of readUIMessageStream({ stream: convertArrayToReadableStream(chunks) })) message = m
  return { chunks, message: message! }
}

const outDir = process.argv[2]
if (!outDir) {
  console.error("usage: node record-streams.ts <out-dir>")
  process.exit(2)
}
mkdirSync(outDir, { recursive: true })

for (const s of SCENARIOS) {
  const { chunks, message } = await collect(s.stream())
  const partTypes = [...new Set(message.parts.map((p) => p.type))].sort()
  const fixture = {
    id: s.id,
    title: s.title,
    recordedWith: `ai@${SDK_VERSION}: streamText + toUIMessageStream over a scripted MockLanguageModelV3. The chunk protocol is the SDK's; the words are written.`,
    partTypes,
    chunks,
    message,
  }
  writeFileSync(path.join(outDir, `${s.id}.json`), JSON.stringify(fixture, null, 2) + "\n")
  console.log(`${s.id}: ${chunks.length} chunks, parts ${partTypes.join(", ")}`)
}
