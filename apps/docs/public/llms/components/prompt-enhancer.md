# Prompt Enhancer

> A button that proposes a rewrite of the prompt in the composer next to it. Click Enhance prompt and a panel shows your original and the rewrite side by side, with every word the enhancer added underlined and described. You accept it, edit it first, or dismiss it. Quick refinements such as More concise and Add examples sit behind an Advanced disclosure. After an accept, Revert to original puts back the exact string you started with. It takes the current `value` and an async `onEnhance`, and hands the accepted text to `onAccept`. It never owns the textarea and never submits.

Layer: component · Family: D · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/prompt-enhancer.json` · Contract: `components/super-ai/prompt-enhancer.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/prompt-enhancer

## Why it matters

A rewrite that runs without being read changes what the person asked for. Prompt enhancers in Adobe Firefly, Bolt, Cofounder, Copy.ai, FloraFauna, Leonardo.ai and v0 all end up in the same place: show the proposed text first, mark what the system added, and keep a way back. The marking is what makes review quick, because the person reads the added constraints instead of diffing two paragraphs by eye. The single default action keeps the common path to one click, and the refinements stay out of the way until someone wants them. Because the component only returns text, the same enhancer works beside any composer.

## When to reach for it

Place it beside your composer and pass the field's current text as `value`. `onEnhance(value, refinement?)` returns a promise of the rewritten string; call your model there and nowhere else. `onAccept(next)` receives the text the person accepted, edits included, and you write it into your own field. Revert calls `onRevert(original)` if you pass it, and otherwise calls `onAccept` with the original. The component reads `value` once, when Enhance starts, so typing while a run is in flight does not change what Revert restores. Pass `refinements` to replace the two default chips. Reject the promise on any failure; the panel then says the prompt is unchanged and offers Try again. For tracked changes on long prose use `diff-review`.

## Variants

None: There is one way to enhance: the same button, panel and states everywhere. Differences in what the rewrite does belong in `onEnhance` and `refinements`, not in a visual axis.

## Instead use

- **slot-summary**: You want to show what the system understood from the request before it acts, as structured fields. This component rewrites the prompt text itself.
- **diff-review**: The AI has edited prose and each change needs its own accept or reject. The enhancer returns one rewrite to take or leave whole.
- **selection-toolbar**: The person selects text in a document and picks an AI action for that selection. The enhancer works on the whole prompt field.
- **suggestion-chips**: You offer starter tasks before anything is typed. The enhancer needs a prompt to rewrite and is disabled until there is one.

## Do

- Write the accepted text into your own field from `onAccept`. The component never reaches into the textarea, so the same enhancer works with any composer.
- Keep Revert one click away after an accept. It restores the exact original, including spacing and line breaks.
- Reject the promise when the model fails. The panel says the prompt is unchanged, and nothing was written to the field.

## Don't

- Don't overwrite the field with the rewrite. The person never sees what changed and has nothing to compare against.
- Don't send the prompt as part of enhancing it. The point of the panel is that someone reads the rewrite before it runs.

## Anatomy

- `prompt-enhancer`: The wrapper. Holds the Enhance button, the Revert button after an accept, and the status region. Carries `data-state`.
- `prompt-enhancer-panel`: The popover that opens on Enhance. It holds the progress line, the comparison or the error, and it carries `data-state` too.
- `prompt-enhancer-title`: The panel heading: Enhancing your prompt, Suggested rewrite or Enhance failed. It also names the dialog.
- `prompt-enhancer-original`: The person's own text, exactly as it was when Enhance started.
- `prompt-enhancer-suggestion`: The rewrite column. A labelled region described by the summary line.
- `prompt-enhancer-added`: An `ins` element around each run of added words. Underlined and tinted, with hidden start and end markers for screen readers.
- `prompt-enhancer-summary`: The count of what was added, for example 8 words added in 2 places. It is the accessible description of the rewrite.
- `prompt-enhancer-advanced`: The disclosure that holds the refinement chips.
- `prompt-enhancer-revert`: The one-step Revert to original button, shown after an accept.
- `prompt-enhancer-status`: A polite status region, always mounted, that announces each state change.

## Accessibility

**Keyboard**

- Idle, the component is one tab stop: the Enhance prompt button. Enter or Space starts the run and opens the panel.
- The panel is a dialog. While enhancing, focus lands on Cancel. When the rewrite arrives, focus moves to Accept; on failure it moves to Try again. The tab order inside the panel is Advanced, then the refinement chips once it is open, then Dismiss, Edit and Accept.
- Escape or a click outside closes the panel. While a run is in flight that cancels it, and a result that arrives afterwards is dropped. In the suggested and failed states it discards the result.
- After an accept the panel closes and focus returns to the Enhance button. The Revert to original button is a second tab stop after it. After a revert, focus returns to the Enhance button.
- Enhance prompt is disabled while the field is empty. Nothing else on the component takes a `disabled` prop. There are no arrow-key or Home and End bindings.

**Screen reader**

- A status region, always mounted, announces politely: Enhancing your prompt. / Suggested rewrite ready. / Enhanced prompt applied. Revert is available. / Original prompt restored. / Enhance failed. Your prompt is unchanged. Idle announces nothing.
- The panel is a dialog named by its heading. The comparison is two labelled regions, Your prompt and Suggested rewrite. The second is described by the summary, for example 8 words added in 2 places.
- Added words are real `ins` elements. Each run is wrapped in hidden text, added start and added end, because screen readers do not reliably announce insertion semantics. The underline marks them for sighted readers; colour is only a second cue.
- Edit mode swaps the marked text for a textarea named Edit the suggested rewrite. The summary updates as the person types but is not a live region, so the new count is read only when someone goes back to it.
- Enhance prompt and Revert to original are named by their visible text; the icons are hidden. The Original restored note after a revert is hidden from assistive tech because the status region already says it.

**Focus**

- Open: focus moves into the panel, to Cancel while enhancing and to Accept or Try again when the state changes.
- Accept, dismiss or cancel: the panel closes and focus returns to the Enhance button.
- Revert: focus moves to the Enhance button, since the Revert button is removed.

## Pitfalls

- Revert restores the string captured when Enhance started, and it overwrites whatever is in the field now. If the person types after accepting and then clicks Revert, those edits are replaced. Call `onRevert` to show your own confirmation if that matters in your product.
- The added-words marking is a word-level comparison. A reordered sentence shows as added words, and a word with a different spelling or case counts as new. Trailing sentence punctuation is ignored, so 'sea' and 'sea,' match.
- Closing the panel in the suggested or failed state discards the result. Reopening starts a new run, so a second model call is made.
- A refinement chip always re-runs from the original text, never from the current suggestion. Refinements do not stack.
- `onEnhance` has no abort signal. Cancel ignores the eventual result, but your request still runs to the end. Cancel it yourself if it is costly.
- A rejected promise shows one generic message. The error text is not displayed, so log it in `onEnhance` if you need it.
- The panel opens at up to 40rem wide, capped to the viewport. The two columns stack on narrow screens.

## Composition

- States: `idle`, `enhancing`, `suggested`, `accepted`, `reverted`, `failed`
- Composes from this registry: nothing
- shadcn primitives: badge, button, collapsible, popover, textarea
- npm: lucide-react

## Evidence

Adobe Firefly, Bolt, Cofounder, Copy.ai, FloraFauna, Leonardo.ai, v0
