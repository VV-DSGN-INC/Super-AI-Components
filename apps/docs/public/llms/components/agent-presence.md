# Agent Presence

> A persistent, quiet cue that an agent is active in this surface. It has two parts: a chip for the app chrome that says what the agent is doing and what it can see or use, and a region wrapper that outlines the tab, frame or panel the agent controls. One menu holds Pause or Resume and Take over, and an optional link leads to the agent's steps. It never opens a modal.

Layer: component · Family: N · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/agent-presence.json` · Contract: `components/super-ai/agent-presence.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/agent-presence

## Why it matters

A browsing agent shares your screen, so the person needs to know at a glance whether it is looking, acting, stuck or paused, and which part of the page it can reach. Perplexity Comet, OpenAI Operator and Zapier workflow approvals each show some form of this cue, though the evidence is thin and the third example is the weakest, so treat the pattern as plausible rather than settled. The scope line is there so the boundary is read rather than assumed, and takeover is one menu action so a person is never more than a click from control. Watching is not a safeguard: Shape of AI cites a prompt-injection flaw in exactly this kind of product, which is why no copy here suggests that oversight prevents harm.

## When to reach for it

Put the chip in app chrome, such as a toolbar or tab strip, and wrap the surface the agent controls in AgentPresenceRegion with the same state. The host owns the state: pass it in, and wire onPause, onResume and onTakeOver to your own agent runtime, which then passes the new state back. Write scope as a sentence about reach, for example "Can see and use this tab". In needs-you, pass need with the approval's name and render your permission prompt elsewhere; this component only points at it. Pass onOpenSteps when you have a trace of the agent's steps to link to. Use a task tray when the work outlives the view, a permission prompt for the approval itself, a trace timeline for the steps, and an autonomy selector for how much the agent may do unasked.

## Variants

None: The six states are what the host reports, not a style choice, so there is no variant axis to pick between.

## Instead use

- **task-tray**: Work outlives the current view and needs a place to be tracked, not an ambient cue on this surface.
- **permission-prompt**: The agent needs a decision from the person; the approval itself belongs there and this chip only names it.
- **trace-timeline**: The person wants to read the agent's steps in order; link to it with onOpenSteps.
- **autonomy-selector**: The question is how much the agent may do unasked, a standing policy rather than live presence.

## Do

- Write scope as a sentence about reach, so a person reads what the agent can see and use.
- Wrap the controlled surface in AgentPresenceRegion with the same state as the chip, so the outline always has its words beside it.
- In needs-you, pass need so the chip names what the agent is waiting for, and keep the approval controls in your permission prompt.

## Don't

- Don't show the outline without the chip. The outline is a colour and a line style, and says nothing in words.
- Don't write a vague scope. A one-word scope tells the person nothing about what the agent can reach.

## Anatomy

- `agent-presence`: The chip root. Carries data-state with the current state.
- `agent-presence-status`: The one persistent role=status element. Its text changes with the state and is announced politely.
- `agent-presence-badge`: The state in words, with a small dot that pulses while the agent is acting or needs you.
- `agent-presence-need`: In needs-you only: the approval the agent is waiting for, named in text. The approval itself is not here.
- `agent-presence-scope`: What the agent can see and use, as a sentence the host supplies.
- `agent-presence-menu`: The icon button that opens Pause or Resume, Take over and View agent steps. Absent when no item applies.
- `agent-presence-region`: The wrapper for the controlled tab, frame or panel. Carries data-state.
- `agent-presence-outline`: The decorative outline over the region. It is aria-hidden and ignores the pointer.

## Accessibility

**Keyboard**

- The chip contributes one tab stop, the Agent controls button, and none when no menu item applies (idle, or taken-over with no steps link).
- Enter or Space on the button opens the menu, the arrow keys move between items, Enter or Space activates one, and Escape closes it and returns focus to the button.
- The region adds no tab stops and the outline overlay ignores the pointer, so it never blocks a click on the content underneath.
- There is no global shortcut for Pause or Take over. A person who cannot reach the chip cannot reach the controls, so place it early in the tab order of the chrome.

**Screen reader**

- One persistent role=status element holds the state sentence, such as "Agent is acting". Changes are announced politely. The element is never unmounted, so every change is read as an update.
- In needs-you the status also carries the need text, so the approval is announced with the state. Nothing in this component is the approval; a screen reader user still needs a way to reach your permission prompt.
- The scope sentence sits outside the live region, so it is read when the person reads the chip and not on every state change.
- The menu button is named "Agent controls". Menu items are named Pause agent, Resume agent, Take over and View agent steps.
- The dot and the region outline are aria-hidden. The state is carried in words, so nothing depends on colour or line style.
- The region wrapper has no role and no accessible name. Name the surface it wraps yourself.

**Focus**

- Choosing Pause, Resume or Take over closes the menu and returns focus to the Agent controls button. If your state change removes the chip, for example by taking it out of the chrome when control returns, move focus yourself.
- When state becomes idle or taken-over the menu button can disappear while it holds focus, which drops focus to the document body. Keep the chip mounted, or move focus in your handler.

## Pitfalls

- State is the host's. The menu only asks: onPause does not change the chip until you pass a new state, so wire the handler to your runtime and render what it reports.
- Watching is not a safeguard. A visible agent can still be steered by hostile page content, so do not write copy that tells people they are protected because they can see it.
- The menu items appear only when you pass their callbacks and the state allows them. A chip with no handlers renders as a status with no button.
- Taken-over has no way back to the agent inside this component. Resume is offered while paused only, so hand control back by passing a new state from your own control.
- The outline is drawn inside the region's box and follows its border radius. Give the region a radius if the surface has rounded corners, or the outline will draw square ones over it.

## Composition

- States: `idle`, `watching`, `acting`, `needs-you`, `paused`, `taken-over`
- Composes from this registry: nothing
- shadcn primitives: badge, button, dropdown-menu
- npm: lucide-react

## Evidence

Perplexity Comet, OpenAI Operator, Zapier workflow approvals
