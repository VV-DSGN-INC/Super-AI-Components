# Private Session Notice

> The notice a product shows when a conversation runs in private (incognito) mode. It has two forms: a banner that states what is and is not remembered, and a small persistent chip that tells the person the mode is still on. It also covers the moments around the mode: connectors running with less access, what happens to the session when it ends, and a plan- or admin-gated state where private mode is not available.

Layer: component · Family: N · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/private-session-notice.json` · Contract: `components/super-ai/private-session-notice.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/private-session-notice

## Why it matters

Private mode only helps if the person can tell, at every moment, that it is on and what it does. ChatGPT, Gemini, Perplexity, Dia and Microsoft Copilot all ship it, and the products that get it right pair one plain sentence before the first message with an indicator that never leaves the header. The sentence is supplied by the host because the component cannot know what the product actually enforces, and a notice that promises more than the backend does is worse than no notice.

## When to reach for it

Pass `statement` every time: it has no default, because the component must never claim more than your backend enforces. Show `state="entering"` above the input before the first message, then switch to `active`, which keeps the chip and tucks the statement behind a toggle. Hand `PrivateSessionChip` (or `form="chip"`) to the topbar's privacy slot so the mode stays visible on every screen; the header tint is the host's choice. Use `connectors-reduced` when connectors run with narrower scope, passing each connector with its scope (`off` or `reduced`). Use `exiting` with the retention outcome your product really applies: `retention={{ kind: "deleted-now" }}`, `kind: "deleted-after"` with its `period`, or `kind: "kept-locally"`. Use `unavailable` with `reason="plan"` or `"admin"` when the mode is switched off for this person.

## Variants

### form (default: `banner`)

- `banner`: The statement is the point and there is room for a block: above the input before the first message, in a connectors summary, or at the moment the session ends.
- `chip`: The mode must stay visible while something else owns the screen. This is the form a topbar slot renders; pick it when only the indicator fits.

## Instead use

- **disclaimer-note**: The text is a caveat about the reliability of AI output ('AI can make mistakes'), not a statement about what is remembered.
- **safety-block**: A request was stopped by policy. A private session never blocks anything; it only changes what is kept.
- **feature-announcement**: You are announcing that private mode exists, as a dismissible promo. This notice is permanent and states what the mode does once it is on.
- **app-topbar**: You are placing the indicator. The topbar owns the privacy slot and renders `PrivateSessionChip` inside it; it is the slot, not the chip.

## Do

- Show the statement above the input before the first message, in plain words, and keep it identical on every screen.
- Keep the chip in the header for the whole session so the mode is visible after the first screen scrolls away.
- Name every reduced connector with its scope as text, not just a count.
- State the retention outcome in the exit state, including the period when it is deleted later.

## Don't

- Don't drop the chip after the first message. Without it nothing on screen says the session is still private.
- Don't write a statement that promises more than the host enforces. An absolute claim such as 'never stored, anywhere' turns a privacy feature into a liability.
- Don't override the exit text with a line that omits what happens to the session. The person closing the chat is deciding whether it survives.

## Anatomy

- `private-session-notice`: Root of the banner form. Carries `data-state` and `data-form`.
- `private-session-chip`: The persistent indicator. Also exported on its own as `PrivateSessionChip`.
- `private-session-chip-label`: The chip text. Every state has its own words, so colour is never the only signal.
- `private-session-controls`: Chip plus the on-demand statement toggle, shown in `active` and `connectors-reduced`.
- `private-session-statement`: The fixed sentence, in a note region. Visible in `entering`, opened on demand elsewhere.
- `private-session-connectors`: The permissions summary: one entity row per connector, with its scope as text.
- `private-session-exit`: The retention outcome, stated as a sentence.
- `private-session-unavailable`: The reason private mode is off, with an optional next step.

## Accessibility

**Keyboard**

- `entering`, `exiting` and `unavailable` have zero tab stops unless you add `action` in `unavailable`. `active` and `connectors-reduced` have one: the toggle that shows the statement. The chip is not focusable unless you give `PrivateSessionChip` an `onClick`, which turns it into a button.
- Enter and Space activate the toggle. There is no Escape handler and no close control, because the notice never dismisses and never expires.
- `disabled` does not exist. `unavailable` is a distinct state, not a switched-off version of another one, so nothing in it is focusable by default.

**Screen reader**

- The banner regions are `role="note"` regions, not `role="alert"` (the vendored Alert default is overridden). A persistent statement is not urgent, and an assertive live region would interrupt every time one mounts. `exiting` is `role="status"` so the retention outcome is announced politely when it appears.
- The toggle is a native button whose name is `statementToggleLabel`; it exposes `aria-expanded` and, while open, `aria-controls` pointing at the statement.
- The chip is plain text with an `aria-hidden` icon, so its accessible name is its label. Scope on each connector row is the text 'Off' or 'Reduced', never colour or position alone.
- Changes between states are not announced, apart from `exiting`: switching `entering` to `active` swaps content silently. If the move into private mode matters to your users, announce it from the host.
- Override strings (`title`, `reasonText`, retention `detail`) replace the English defaults. Keep them as full sentences, since the announcement is the string itself.

**Focus**

- Nothing here moves focus. Opening the statement leaves focus on the toggle, and unmounting a state does not restore it, so the host should keep focus on its own control when it changes `state`.

## Pitfalls

- Treating `statement` as copy you can tune per screen. It is meant to be one fixed sentence; varying it makes the guarantee unreadable and invites claims the backend does not make.
- Using the banner form inside a topbar. The topbar slot wants the chip; the banner is a block that belongs above the input.
- Forgetting that `connectors-reduced` shows the rows you pass. If a connector is missing from `connectors`, the notice says nothing about it, so list every connector whose scope differs from normal.
- Animating the chip in or out, or hiding it on a timer. The component has no motion and no timers; adding them breaks the 'never silently expires' property.

## Composition

- States: `entering`, `active`, `connectors-reduced`, `exiting`, `unavailable`
- Composes from this registry: entity-row
- shadcn primitives: alert, badge, button
- npm: lucide-react

## Evidence

ChatGPT, Google Gemini, Google Chrome, Perplexity, Comet, Dia, Microsoft Copilot, Notion AI, Apple Siri
