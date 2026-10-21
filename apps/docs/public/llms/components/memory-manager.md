# Memory Manager

> A card listing what the assistant remembers about a person, split into preferences and facts. Each memory shows its scope, when it was added and where it came from, and can be edited in place or deleted. A switch turns memory off and says what stops, and one reset action clears everything behind a confirmation. A small chip, exported separately, tells the person in the conversation that a memory was just saved.

Layer: component · Family: N · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/memory-manager.json` · Contract: `components/super-ai/memory-manager.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/memory-manager

## Why it matters

Memory is only trusted when it can be inspected. ChatGPT, Claude, Gemini, Perplexity and Apple each let a person see saved memories, but they differ on whether a memory shows its source, whether work and personal sets are told apart, and how a wipe is confirmed. Shape of AI's memory pattern asks for the same things this component builds in: visible provenance, scope you can read, per-item control, and a capture moment that does not happen silently.

## When to reach for it

Pass `memories` and own them: the component calls `onEdit(id, text)`, `onDelete(id)` and `onReset()` and you update the list. Give each memory a `scope`, either `"global"` or `{ workspace }`, and pass `activeWorkspace` when the person has more than one memory set so rows held for another workspace say they are not used. Set `source` whenever you know it. Control `enabled` with `onEnabledChange`. When the assistant saves something, render `MemorySavedChip` in the conversation with an `onReview` that opens this card, and pass the new item's id as `justSavedId` so the row is marked. Training and retention belong in data-controls, and a session that remembers nothing belongs in private-session-notice.

## Variants

None: No variant axis: the seven states are driven by the data and the host, through memories, scope, enabled and the justSavedId, defaultEditingId and defaultResetOpen props.

## Instead use

- **data-controls**: The choice is about training on conversations or how long they are retained. That is data handling by the provider, not what the assistant recalls about the person.
- **private-session-notice**: You need to tell the person this session remembers nothing. Memory-manager only mentions private sessions in one sentence of copy.
- **settings-dialog**: You need the whole settings surface with navigation and many sections. Memory-manager is one section's worth and lives inside that surface.
- **asset-library**: The person is managing their own files and uploads. Memory-manager holds what the assistant inferred, not what the person stored.

## Do

- Show scope, date and source on every row, as text, so no memory is a black box.
- Edit in place with a labelled field and Save/Cancel, so the person corrects a memory without deleting and re-teaching it.
- Tell the person in the conversation when a memory is saved, with a way to review it.
- Put reset behind a confirmation that says what it deletes and what it keeps.

## Don't

- Don't list memories as bare sentences. Without a date, a source and a scope, nobody can judge whether to keep one.
- Don't offer a Clear button that acts at once and does not say what it removes.
- Don't mix preferences and facts in one pile. How the assistant should write and who the person is get reviewed differently.

## Anatomy

- `memory-manager`: The card. A named group, so a screen reader announces the section.
- `memory-manager-title`: Card title. A heading whose level you set with `headingLevel`; focus moves here after a delete.
- `memory-manager-switch`: Turns memory on or off. Described by the statement beside it.
- `memory-manager-statement`: One sentence on what happens now, and what stops when the switch is off.
- `memory-manager-private-note`: Names private sessions in copy. It renders no notice.
- `memory-manager-group`: One group, Preferences or Facts, with a labelled header and count.
- `memory-manager-item`: One memory. Carries `data-kind`.
- `memory-manager-text`: The remembered sentence. It names the row's buttons.
- `memory-manager-meta`: Scope, date added and source, as text. Beside the row, not inside it, so it never truncates.
- `memory-manager-edit`: Opens the in-place editor for this row.
- `memory-manager-delete`: Deletes this row only. Calls `onDelete` with its id.
- `memory-manager-editor`: The editing form: a labelled textarea with Save and Cancel.
- `memory-manager-reset`: Opens the reset confirmation. Absent when nothing is saved.
- `memory-manager-reset-dialog`: Alert dialog saying what is deleted and what is kept. `onReset` fires from its confirm button only.
- `memory-manager-status`: Visually hidden live region for saves, deletes and resets.
- `memory-saved-chip`: The capture-moment chip, a separate export you place in the chat.
- `memory-saved-chip-review`: Calls `onReview`. Only present when you pass the handler.

## Accessibility

**Keyboard**

- Tab stops in order: the memory switch, then for each row Edit and Delete, then Reset all memories. Space toggles the switch; Enter or Space activates a button.
- In the editor the textarea takes focus on open; Tab reaches Save then Cancel. Enter inside the textarea adds a new line, so Save is the button. Escape cancels the edit and does nothing else.
- Save is natively disabled while the field is empty, which removes it from the tab order.
- The reset dialog traps focus, Escape closes it without calling `onReset`, and the confirm button is the only way to fire it. The component does not set `disabled` anywhere else; there is no prop that disables the whole card.

**Screen reader**

- The card is a `group` named by its title, and the title is a heading at the level you pass in `headingLevel`. Each memory group is a labelled section whose name includes its count.
- Edit and Delete are named by their own text plus the memory sentence through `aria-labelledby`, so a list of buttons reads "Delete Use British spelling in documents." rather than ten identical "Delete" buttons. A very long memory makes a long name.
- The switch is named "Memory" and described by the statement, so the sentence saying what stops is read with the control.
- Dates are `time` elements with a machine-readable value; scope and source are plain text, never a colour or an icon alone.
- Saves, deletes and resets are announced through one polite status region. The switch announces its own new state; the changed statement beside it is not in a live region and is read only when the person moves to it.
- `MemorySavedChip` is `role="status"`, so it is announced when it is inserted. Insert it fresh; one that is already on the page when it first renders is not announced. Its review button is named "Review" plus the chip label.

**Focus**

- Opening the editor moves focus to the textarea. Save or Cancel returns focus to that row's Edit button.
- Delete and a confirmed reset move focus to the card title, because the row or the Reset button they came from is gone. Cancelling a dialog opened from the Reset button returns focus to that button.

## Pitfalls

- Not updating `memories` in the handlers. The component is controlled: `onEdit`, `onDelete` and `onReset` only report the request, so a handler that does nothing leaves the list unchanged.
- Rendering `MemorySavedChip` inside this card. It belongs in the conversation, at the moment of capture; the card only marks the row with `justSavedId`.
- Passing a local-time string as `addedAt` and expecting local dates. Dates are shown as calendar dates in UTC so the text is identical on every machine; pass an ISO date.
- Putting training or retention controls in this card. They govern the provider's data use, not what the assistant recalls about the person; use data-controls for them.
- Expecting `enabled={false}` to hide or disable the list. Saved memories stay visible and editable while memory is off, because the person must still be able to delete them.
- Pairing `text-muted-foreground` with a muted, accent or secondary surface when you wrap the card. The rows are written for the card surface; if you paint the wrapper, rebind `--muted-foreground` on it.

## Composition

- States: `empty`, `populated`, `scoped`, `just-saved`, `editing`, `memory-off`, `reset-confirm`
- Composes from this registry: entity-row, section-header
- shadcn primitives: alert-dialog, badge, button, card, label, switch, textarea
- npm: lucide-react

## Evidence

ChatGPT, Claude, Gemini, Perplexity, Apple
