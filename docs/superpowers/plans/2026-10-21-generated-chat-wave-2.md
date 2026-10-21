# Generated chat wave 2: the real model, implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Free-text questions on `/generated-chat` go to a real model through Vercel AI Gateway, which answers with the same message parts the script writes. Chips and ready prompts stay scripted.

**Architecture:** A Next route handler streams a UI message stream: `streamText` with three read-only tools whose `execute` writes data parts through the stream writer. A client transport routes each message: an exact script match plays the scripted turn, anything else goes to the route, and any failure falls back to the scripted fallback turn.

**Tech stack:** AI SDK 7.0.6 (`streamText`, `createUIMessageStream`, `toUIMessageStream`, `convertToModelMessages`, `ai/test` `MockLanguageModelV4`), zod 4, Next 16 route handlers, Vercel OIDC for gateway auth.

**Spec:** `docs/superpowers/specs/2026-10-20-generated-chat-design.md` section 4.4 and open question 2.

## Global constraints

- Kill switch: `GENERATED_CHAT_MODEL` holds the gateway model ID. Unset, empty or `off` means no model: the route answers 503 and the page stays scripted. No model ID is hard-coded.
- The route takes POST only, a 32 KB body cap (413), the last 12 messages, `maxOutputTokens` 800, and 20 requests per address per 10 minutes (429, in memory per instance).
- Tools are read-only: `show_card`, `build_view`, `suggest_followups`. Inputs are enums of what the page can render; `suggest_followups` items are scripted chip phrases, so a chip click always resolves to a scripted turn.
- Every model reply ends with words and chips: the handler adds the scripted fallback sentence and the ready prompts when the model wrote none.
- The route imports only types from the `"use client"` lib. Shared values move to server-safe demo modules.
- Production stays scripted: the env var is set only on preview deploys, and only after the six-sample evals pass.
- Public tree: no client name, scenario or data.

## Review focus

1. A model stream that errors halfway: the reader gets the partial text plus the fallback, never a spinner that ends silently.
2. A tool call with an input outside the enum: rejected by the schema, no card posted, the reply still ends with chips.
3. A conversation holding local question cards and data parts: the model sees them as short text, and nothing crashes on an unknown part.
4. The kill switch flipped while the page is open: the next free-text message gets the fallback, not an error.
5. A chip the model suggests that the script does not know: impossible by schema.

## Tasks

### Task 1: server-safe view catalog
- Create `components/generated-chat/views.ts`: `READY_PROMPTS`, `VIEW`, `SPEND_VIEW`, `spendVersion(n, variant)`, `buildFailedRunsView(origin)`, `buildSpendView(origin)` returning `ViewInput`, and `CHIPS` (every chip phrase any turn offers, plus the ready prompts).
- `turns.ts` imports these; behaviour unchanged.
- Test `views.test.ts`: every chip in every scripted turn's suggestions is in `CHIPS`, and every `CHIPS` entry has a script (`hasScript`).

### Task 2: rate limiter
- `components/generated-chat/server/rate-limit.ts`: `createRateLimiter({ limit, windowMs })` → `{ check(key: string, now: number): boolean }`.
- Tests: allows `limit` calls, refuses the next, allows again after the window, keys are independent, old keys are pruned.

### Task 3: system prompt and part conversion
- `server/system-prompt.ts`: `systemPrompt()` built from the fixtures (overnight runs, failures, credits, plan, spend by project, the views it can build, the tool rules).
- `server/model-messages.ts`: `toModelMessages(messages)`: the last 12, data parts converted to short text (`[Showed the failed-runs card]`, `[Built the view Failed runs this week]`, `[Asked: Retry 2 video runs?]`), suggestions dropped.
- Tests: numbers in the prompt come from the fixture functions; conversion keeps 12 and converts each data part.

### Task 4: chat handler
- `server/chat-handler.ts`: `createChatHandler({ model: LanguageModel | null, limiter, now? })` → `(req: Request) => Promise<Response>`.
- Tests (node environment, `MockLanguageModelV4`): 503 with no model; 413 over the cap; 400 on bad JSON; 429 when the limiter refuses; a `show_card` call streams a `data-card`; a `build_view` call streams a transient `data-effect` then a `data-view`; `suggest_followups` streams `data-suggestions`; no chips from the model adds the ready prompts; no text adds the fallback sentence; the model sees at most 12 messages and `maxOutputTokens` 800.

### Task 5: route
- `app/api/chat/route.ts`: `POST = createChatHandler({ model: modelFromEnv(process.env.GENERATED_CHAT_MODEL), limiter })`, `maxDuration = 30`. `modelFromEnv` in `server/model-from-env.ts`, tested.

### Task 6: client transport
- `components/generated-chat/model-transport.ts`: `createModelTransport({ api, scripted, turns, fetch? })`.
- Tests: a scripted phrase never fetches; free text fetches the route and streams its parts; a 503 or a thrown fetch plays the fallback turn; an error chunk mid-stream appends the fallback parts and finishes.

### Task 7: demo and page
- `GeneratedChatDemo` takes `model?: boolean`; the page passes `modelEnabled()` and its copy says which mode is on; the composer note follows.
- Tests: model off keeps every existing test green; model on sends free text to the route and keeps chips scripted.

### Task 8: evals, spec, gates, preview
- `scripts/eval-generated-chat.mts`: six samples of each hero free-text question against the live gateway model; checks words, chips, the expected tool and no claimed actions.
- Spec 4.4 and open question 2 updated with the rulings.
- Full CI order, rendered sweep, preview deploy with the env set for that deployment only, live check, PR stacked on #110.
