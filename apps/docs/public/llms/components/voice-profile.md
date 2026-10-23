# Voice Profile

> A card for the rules that decide how output sounds. The current voice sits at the top with its source and scope in text, a list of saved voices lets the person switch in one press, and a personal voice is edited as rules: tone, words to use, words to avoid, formatting and an example. An optional preview writes a sample under the rules as they stand. When two voices could apply the card says which wins and why, and one button resets to neutral. A small chip, exported separately, shows the active voice beside the input.

Layer: component · Family: E · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/voice-profile.json` · Contract: `components/super-ai/voice-profile.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/voice-profile

## Why it matters

A voice is only trusted when the person can see which one is speaking and where it applies. Dia, ElevenLabs, Grammarly, Jasper, Midjourney and Tabnine each let a person shape output style, and they differ on whether the active style is visible at the point of writing, whether it follows the person everywhere or stays in one project, and whether a way back to default exists. Shape of AI's voice and tone pattern names the failure this component guards against: a global tone leaking into a project it does not belong to.

## When to reach for it

Pass `voices` and `activeId`, and own both: the component calls `onActiveChange(id)`, `onSave(voice)`, `onScopeChange(id, scope)` and `onReset()` and you update your list. A voice is `{ id, name, source, scope, rules }` where `source` is `"personal"`, `"team"` or `"system"` and `scope` is `"global"` or `{ project }`. Only a personal voice can be edited or re-scoped here. Pass `activeProject` when the person works in projects, so voices held to another project say they are not used. Work out conflicts yourself and pass `conflict` with the winner, the other voice and one sentence of reason. Pass `onPreview(rules)` returning a promise of sample text to enable previews; it receives the unsaved draft while editing. Render `ActiveVoiceChip` next to your composer with the same voice and an `onOpen` that shows this card. Saved visual styles belong in preset-grid and what the assistant knows about the person belongs in memory-manager.

## Variants

None: No variant axis: the seven states are driven by the data and the host, through voices, activeId, activeProject, conflict and defaultEditingId, and by pressing Reset.

## Instead use

- **preset-grid**: The person is picking a saved visual style from a grid of previews. Voice-profile holds rules for how output sounds, not how it looks.
- **memory-manager**: You need to show what the assistant knows about the person, such as facts and preferences it saved. A voice is rules for style, not recalled information.
- **mode-tabs**: The choice is a mode of work, such as chat or code, and not a voice. Switching a mode changes what the assistant does; a voice changes how it writes.
- **parameter-panel**: The person is tuning generation parameters such as length or randomness. Those are numeric settings, not named rules with an example.

## Do

- Show the active voice at the input, with its name, source and scope in text, and let it open the profile.
- Hold a voice to a project when it only makes sense there, and say so on every row.
- Name the winner and the reason when two voices could apply.
- Let the person check the rules against a sample before they trust them.
- Make reset to neutral one press, and say that saved voices are kept.

## Don't

- Don't reduce a voice to a mood. A tone button says nothing about words, formatting or an example.
- Don't show a voice without its scope. A global tone that follows the person into the wrong project is the failure this pattern exists to prevent.
- Don't pick a winner silently. When a second voice is ignored, the person needs to be told which and why.

## Anatomy

- `voice-profile`: The card. A named group, so a screen reader announces the section.
- `voice-profile-title`: Card title. A heading whose level you set with `headingLevel`.
- `voice-profile-current`: The active voice's name, or Neutral. Focus lands here after Use and Reset.
- `voice-profile-current-meta`: Source and scope of the active voice as text, or the neutral and just-reset sentence.
- `voice-profile-reset`: Reset to neutral. One press, one `onReset` call. Absent while neutral.
- `voice-profile-conflict`: Names the winning voice, the one it wins over, and the reason. Carries `data-winner`.
- `voice-profile-rules`: The active voice's rules as a description list. Empty rules are omitted.
- `voice-profile-scope`: The Applies to select. Only for a personal voice when a project is known.
- `voice-profile-edit`: Opens the rules editor. Only on a personal voice.
- `voice-profile-editor`: The editing form: name, tone, words to use, words to avoid, formatting, example, Save and Cancel.
- `voice-profile-preview`: Preview a sample button and its live output. Present only when you pass `onPreview`.
- `voice-profile-list`: The saved voices with a labelled header and count.
- `voice-profile-item`: One voice. Carries `data-source` and `data-active`.
- `voice-profile-item-meta`: Source and scope beside the row, never inside it, so it never truncates.
- `voice-profile-use-voice`: Switches to this voice. Replaced by an Active badge on the current one.
- `voice-profile-status`: Visually hidden live region for switches, saves and resets.
- `active-voice-chip`: The input-side indicator, a separate export. A button when `onOpen` is passed.

## Accessibility

**Keyboard**

- Tab stops in order: Reset to neutral (only while a voice is active), then for a personal voice the Applies to select, Preview a sample when present, and Edit rules, then Use on each voice that is not active. Enter or Space activates a button; Enter or Space opens the select and arrow keys choose within it.
- In the editor the name field takes focus on open and Tab reaches each field, then Preview, Save voice and Cancel. Enter inside a single-line field submits the form; Enter inside the example textarea adds a line. Escape cancels the edit and does nothing else.
- Save voice is natively disabled while the name is empty, which removes it from the tab order. Preview is disabled while a sample is being written. No prop disables the whole card.
- There is no confirmation step on reset, so Escape and Cancel have nothing to close there. The chip is a tab stop only when `onOpen` is passed; without it the chip is plain text.

**Screen reader**

- The card is a `group` named by its title, and the title is a heading at the level you pass in `headingLevel`. The current voice and the rules each sit in a labelled section.
- Use is named by its own text plus the voice name through `aria-labelledby`, so the list reads "Use Formal" rather than several identical "Use" buttons. A very long voice name makes a long button name.
- Rules are a description list, so each term is paired with its value. Source and scope are plain text on every row, never a colour or an icon alone.
- Switches, saves, resets and scope changes are announced through one polite status region. The sample from a preview is announced through its own polite region, which stays mounted. The conflict block is not a live region: it is read when the person moves to it, so a conflict that appears after a change is announced as nothing.
- The Applies to select is named by its label plus its current value. `ActiveVoiceChip` has no role of its own; as a button its name is its visible text, such as the voice name, source and scope read in sequence.

**Focus**

- Opening the editor moves focus to the name field. Save or Cancel returns focus to Edit rules.
- Use and Reset to neutral move focus to the current-voice line, because the button they came from is replaced. That line is focusable by script only and is not a tab stop.

## Pitfalls

- Not updating `activeId` in the handlers. The component is controlled: `onActiveChange` and `onReset` only report the request, so a handler that does nothing leaves the voice unchanged.
- Expecting `onReset` to delete voices. It means return to neutral; saved voices stay in the list and the card says so.
- Passing `conflict` for a voice id that is not in `voices`. The card falls back to printing the raw id.
- Resolving a conflict in your own code and never passing it. If two voices apply and the person is not told which wins, the reply seems to ignore a voice for no reason.
- Expecting a team or preset voice to be editable. Only `source: "personal"` shows Edit rules and the scope select; the rules of the others are read-only text.
- Returning a preview that never settles. The Preview button stays disabled while the promise is pending, so reject on timeout.
- Pairing `text-muted-foreground` with a muted, accent or secondary surface when you wrap the card. The rows are written for the card surface; if you paint the wrapper, rebind `--muted-foreground` on it.

## Composition

- States: `none`, `preset`, `custom`, `editing`, `scoped`, `conflict`, `reset`
- Composes from this registry: entity-row, section-header
- shadcn primitives: badge, button, card, input, label, select, textarea
- npm: lucide-react

## Evidence

Dia, ElevenLabs, Grammarly, Jasper, Midjourney, Tabnine
