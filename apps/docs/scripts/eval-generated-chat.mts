/**
 * Six-sample evals for the /generated-chat model path. Each hero question runs
 * six times against the live gateway model through the real handler, and every
 * sample is checked for words, chips last, chips from the allowed set, no
 * error, no claimed action, and the question's own expectation.
 *
 *   GENERATED_CHAT_MODEL=anthropic/claude-haiku-5.5 npx tsx scripts/eval-generated-chat.mts
 *
 * Gateway auth comes from VERCEL_OIDC_TOKEN (vercel env pull) or AI_GATEWAY_API_KEY.
 * The model path stays off in production until this passes.
 */
import { creditsLeft, fmt } from "../components/generated-chat/fixtures";
import { createChatHandler } from "../components/generated-chat/server/chat-handler";
import { modelFromEnv } from "../components/generated-chat/server/model-from-env";
import { createRateLimiter } from "../components/generated-chat/server/rate-limit";
import { CHIPS } from "../components/generated-chat/views";

type Chunk = { type: string; delta?: string; data?: { type?: string; viewId?: string; items?: string[] } };
interface Reply {
  text: string;
  cards: string[];
  views: string[];
  chunks: Chunk[];
}

const SAMPLES = 6;
const CLAIMED_ACTION =
  /\b(I('ve| have)? (retried|queued|restarted|re-?run|deleted|changed|started)|retrying now|queued (both|them|it))\b/i;

const QUESTIONS: { ask: string; expect: string; ok: (r: Reply) => boolean }[] = [
  {
    ask: "which runs broke last night?",
    expect: "shows the failed-runs card",
    ok: (r) => r.cards.includes("failed-runs"),
  },
  {
    ask: "how many credits do we have left?",
    expect: `states ${fmt(creditsLeft())} credits left`,
    ok: (r) => r.text.includes(fmt(creditsLeft())),
  },
  {
    ask: "where is our spend going this week?",
    expect: "shows the week-spend card or builds the spend view",
    ok: (r) => r.cards.includes("week-spend") || r.views.includes("spend"),
  },
  {
    ask: "I want to keep an eye on spend per project",
    expect: "builds the spend view",
    ok: (r) => r.views.includes("spend"),
  },
  {
    ask: "retry the failed videos for me",
    expect: "shows the failed-runs card and claims no action",
    ok: (r) => r.cards.includes("failed-runs") && !CLAIMED_ACTION.test(r.text),
  },
  {
    ask: "what's the weather in Paris?",
    expect: "shows nothing and stays on the workspace",
    ok: (r) => r.cards.length === 0 && r.views.length === 0 && !/°|degrees|sunny|rain/i.test(r.text),
  },
];

const model = modelFromEnv(process.env.GENERATED_CHAT_MODEL);
if (!model) throw new Error("Set GENERATED_CHAT_MODEL to a gateway provider/model ID.");
const handler = createChatHandler({ model, limiter: createRateLimiter({ limit: 1000, windowMs: 1 }) });

async function ask(question: string): Promise<Reply> {
  const res = await handler(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ id: "u", role: "user", parts: [{ type: "text", text: question }] }],
      }),
    }),
  );
  const chunks = (await res.text())
    .split("\n")
    .filter((line) => line.startsWith("data: ") && line !== "data: [DONE]")
    .map((line) => JSON.parse(line.slice(6)) as Chunk);
  return {
    chunks,
    text: chunks
      .filter((c) => c.type === "text-delta")
      .map((c) => c.delta ?? "")
      .join(""),
    cards: chunks.filter((c) => c.type === "data-card").map((c) => c.data?.type ?? ""),
    views: chunks.filter((c) => c.type === "data-view").map((c) => c.data?.viewId ?? ""),
  };
}

function universal(r: Reply): string[] {
  const problems: string[] = [];
  const data = r.chunks.filter((c) => c.type.startsWith("data-") && c.type !== "data-effect");
  if (!r.text.trim()) problems.push("no words");
  if (data.at(-1)?.type !== "data-suggestions") problems.push("chips not last");
  const chips = data.at(-1)?.data?.items ?? [];
  if (chips.some((chip) => !(CHIPS as readonly string[]).includes(chip)))
    problems.push("chip outside the set");
  if (r.chunks.some((c) => c.type === "error")) problems.push("error chunk");
  if (CLAIMED_ACTION.test(r.text)) problems.push("claimed an action");
  if (/failed-runs|week-spend|\b(above|below)\b/i.test(r.text))
    problems.push("names a card by ID or position");
  return problems;
}

let failed = false;
console.log(`model ${model} · ${SAMPLES} samples per question\n`);
for (const q of QUESTIONS) {
  const replies = await Promise.all(Array.from({ length: SAMPLES }, () => ask(q.ask)));
  const passes = replies.filter((r) => universal(r).length === 0 && q.ok(r)).length;
  const verdict = passes === SAMPLES ? "pass" : "FAIL";
  if (passes !== SAMPLES) failed = true;
  console.log(`${verdict}  ${passes}/${SAMPLES}  "${q.ask}"  (${q.expect})`);
  for (const r of replies) {
    const problems = [...universal(r), ...(q.ok(r) ? [] : ["missed the expectation"])];
    if (problems.length)
      console.log(
        `      ${problems.join(", ")} · ${JSON.stringify(r.text.slice(0, 140))} · cards ${r.cards} · views ${r.views}`,
      );
  }
}
process.exit(failed ? 1 : 0);
