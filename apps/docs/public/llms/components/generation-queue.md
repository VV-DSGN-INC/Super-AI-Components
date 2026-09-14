# Generation Queue

> A list of in-flight generation slots — one row per requested result — that carries each slot from queued to running to a final done or failed state. Each row is an entity row (icon, title, description, trailing controls) rather than a media tile, and an optional header shows the batch's overall progress alongside a Cancel-all action.

Layer: component · Family: E · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/generation-queue.json` · Contract: `components/super-ai/generation-queue.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/generation-queue

## Why it matters

Every generation surface on the reference board needs somewhere to put work that hasn't resolved yet, and it needs two different numbers at once: how far along the whole batch is, and how far along any one slot is. Collapsing those into a single percentage is the recurring mistake this pattern exists to prevent — a batch that's '50% done' could mean one slot at 100% and one at 0%, or five slots all sitting at 50%, and only the per-slot bars tell those two apart.

## When to reach for it

Reach for it the moment a generation request is submitted — create the row (in `queued`) before any result exists, so the slot is reserved and the list never reflows as work resolves. Move each item through `queued` → `running` → `done`/`failed`/`cancel` by updating its `state` (and `progress` while running); the component is fully controlled, so nothing about pacing or polling lives inside it. Supply `onCancelItem` and `onCancelAll` to expose cancellation, and `onRetryItem` to let a failed slot re-queue.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Create the row the instant a slot is submitted, and let one row carry it through queued, running and done — never swap in a different component per state.
- Show the batch's aggregate progress and each row's own percentage side by side — they are different numbers and both are load-bearing.

## Don't

- Don't reduce done vs. failed to a coloured dot — pair colour with a distinct icon and a text label so it survives grayscale and screen readers.
- Don't let Cancel (per-row or Cancel-all) reach a slot that has already resolved — a finished result should never carry a cancel affordance.

## Anatomy

- `generation-queue`: Root wrapper around the header and the list of slots.
- `generation-queue-header`: Heading, Cancel-all and the batch progress bar, shown when any is present.
- `generation-queue-batch-progress`: The aggregate progressbar — a different number from any one slot's own.
- `generation-queue-cancel-all`: Only rendered while at least one slot is still queued or running.
- `generation-queue-items`: The list of slots, in submission order.
- `generation-queue-item`: One slot: an entity row plus, while running, its own progressbar.
- `generation-queue-item-progress`: Per-slot progressbar — real progressbar semantics, not a styled div.
- `generation-queue-cancel`: Per-row Cancel, named after that row's own title.
- `generation-queue-retry`: Per-row Retry, shown only while that slot is failed.
- `generation-queue-item-status`: Visually hidden role=status text announcing that row's transitions.

## Accessibility

**Keyboard**

- A row's tab-stop count is a function of its state, and its state changes on its own. `queued` and `running` rows expose one Cancel, `failed` rows expose one Retry, `done` and `cancel` rows expose nothing. A queue of eight resolving one at a time sheds a tab stop each time.
- Cancel-all is one more stop, and it unmounts the moment nothing is left to cancel.
- The rows themselves are not focusable. A9 `entity-row` is composed without `onSelect`, so it stays a plain `<div>`: the title, description and badge are text, and the only controls are the buttons in its trailing slot.
- There is no keyboard shortcut for anything. Escape does not cancel, and Delete does not dismiss a resolved row.

**Screen reader**

- Every row carries its own visually hidden `role="status"`, so a queued → running → done transition is announced even though the badge and icon already show it. Eight rows means eight live regions, and a batch that resolves at once queues eight announcements.
- That status text includes the percentage while a row is running — "Frame 3: Running, 42%" — so forwarding every server tick reads a fresh percentage aloud on every tick. Throttle to something like every 5–10%.
- Progress is real `role="progressbar"` semantics with `aria-valuenow` and a formatted `aria-valuetext`, both per row and for the batch, so the number is never carried by bar width alone. Omit a running row's `progress` and it announces as indeterminate.
- The batch's "3/8" counter is `aria-hidden`; that information reaches assistive tech through the progressbar's value instead of through the text.
- Done and failed differ by icon shape and by a text badge, so neither depends on colour. Every icon is `aria-hidden`, and it is the badge text that gets announced.
- Cancel and Retry are icon-only and take their names from `cancelItemLabel` / `retryItemLabel`, defaulting to "Cancel <title>" and "Retry <title>". Override them with something that still names the row, or a queue of eight ships eight identical "Cancel" buttons.
- The heading is a `<p>`, not a heading element, so "Generating 4 images" is not reachable by heading navigation — and the `<ul>` beneath it has no accessible name of its own.

**Focus**

- This is the component's real hole: focus lives on controls the server removes. A `running` row resolving while its Cancel button holds focus unmounts that button and focus falls to `<body>`, mid-queue, with no user action involved.
- Cancel-all is the same failure by design — cancelling everything empties the cancellable set, the button unmounts, and focus lands on `<body>`. Move focus to the heading or the list inside your `onCancelAll`.
- Retry is the mirror image. A failed row that retries becomes `queued`, which swaps Retry for Cancel; the element is replaced rather than relabelled, so focus is lost there too.
- All four controls are vendored Buttons and carry the shared `focus-visible` ring. The queue adds no focus styling of its own.

## Pitfalls

- Cancel-all only ever receives queued/running ids from the component, but that only protects the batch action — a hand-rolled per-row Cancel button outside `onCancelItem` can still target a resolved slot if you're not careful about which rows render it.
- The batch bar falls back to a resolved/total ratio when `batchProgress` is omitted. That ratio is a reasonable default for same-weight slots, but silently misleading once slots represent different amounts of work — pass an explicit `batchProgress` in that case instead of trusting the fallback.
- Updating a running row's `progress` on every server tick fires that row's `role=status` announcement every time the text changes, which reads as a percentage read out loud on every tick for screen reader users. Throttle updates (e.g. every 5–10%) rather than forwarding every event verbatim.

## Composition

- States: `queued`, `running`, `done`, `failed`, `cancel`
- Composes from this registry: entity-row
- shadcn primitives: badge, button, progress, skeleton
- npm: lucide-react

## Evidence

Midjourney, Freepik, Playground, getimg
