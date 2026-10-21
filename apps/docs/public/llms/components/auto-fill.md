# Auto Fill

> One prompt that fills a field across many records. A column-header action opens the configuration, a preview runs the prompt on the first few records and shows each result next to the value already there, and only then does Apply to all write anything. Each generated cell stays marked until a person accepts it or replaces it.

Layer: component · Family: P · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/auto-fill.json` · Contract: `components/super-ai/auto-fill.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/auto-fill

## Why it matters

Filling a column by prompt is a bulk change to data a person owns, so the cost of a bad prompt is a column of wrong values. Attio, Clearfeed, Coda, Linear, LogicGate and Relay all fill fields from a prompt, and LogicGate removes the AI mark when a value is accepted and Linear gives each value a justification. Notion and Zapier show the same trial run on a few records before the full run. That trial run is this component's sample-preview state: Sample response lives here as sample-preview (D29) rather than as its own item.

## When to reach for it

Put `AutoFill` in the header of the column it fills and render the column's cells with `AutoFillCell`. Everything async is yours: `onSample` receives the prompt and the ids of the first few records and returns a value for each, `onApply` receives the prompt and the overwrite choice and does the run, and `progress` is whatever you know about it. Keep the cell status in your own state. The component never writes a value; it tells you what the person chose. It does not import any collection component, so it works in a data-views table, a plain table or a form. Use `AutoFillPanel` instead of `AutoFill` when the flow belongs inline in a side panel.

## Variants

None: The component has one shape. What differs between uses is which phase it is in, which is state the flow owns, not a design choice a caller makes between looks.

## Instead use

- **data-views**: You need the collection itself: the table, board or feed that holds the records. Auto fill is the column action and cell renderer such a view hosts, and it does not draw the collection.
- **approval-card**: A person is approving one artifact, such as a single draft or a single action, rather than reviewing many generated field values in place.
- **diff-review**: The change is tracked edits on prose, where the reader accepts or rejects spans inside one document rather than values across many records.
- **run-button**: One generation is started once and its result lands in one place. Auto fill is for the same prompt across many fields, with a preview in front of it.

## Do

- Run the preview before the full run, and show the result beside the existing value so a person can judge what Apply to all would change.
- Keep the generated mark on a suggested cell until someone accepts or replaces it, and give the reason when you have one.

## Don't

- Don't render a suggested value as plain text. Without the mark, a person cannot tell which cells they wrote.
- Don't turn overwrite on for the person or hide how many filled cells it would replace. Human content is skipped unless they choose otherwise.

## Anatomy

- `auto-fill`: The column-header action. A small button that opens the panel in a popover.
- `auto-fill-panel`: The flow itself: configuring, sample-preview, applying and failed. `data-phase` names the current one.
- `auto-fill-field`: Target field select.
- `auto-fill-prompt`: The prompt. A default prompt is shown here and stays editable.
- `auto-fill-overwrite`: The overwrite switch. Off by default; its text says how many filled cells it would change.
- `auto-fill-samples`: The preview rows: existing value beside the suggestion, with cost and time.
- `auto-fill-apply`: Apply to all. The only control that starts a write.
- `auto-fill-applying`: Progress and Cancel while the run is going.
- `auto-fill-failed`: The failure message, which always says every existing value was kept.
- `auto-fill-cell`: The cell renderer. `data-status` is suggested, accepted or overridden.
- `auto-fill-cell-actions`: Accept and Override, present only while the value is suggested.

## Accessibility

**Keyboard**

- The header action is one tab stop. Enter or Space opens the popover, and Escape closes it and returns focus to the action.
- Inside the panel the order is field select, prompt, overwrite switch, then the phase button: Preview on first N records, then Apply to all, Run again and Edit prompt. The switch toggles with Space.
- A suggested cell is two tab stops, Accept and Override. Override opens a small popover with a value field, an optional reason, Save and Cancel. Save is disabled while the value is blank.
- There is no arrow-key navigation between cells and no shortcut for accepting every suggestion. Accepting a column is a host feature, not something this component provides.

**Screen reader**

- The panel is a labelled section. A visually hidden status line announces when the preview is ready and when the run starts; progress itself is a progressbar with a value text such as 2 of 5 cells.
- The failure message has role alert, so it is announced as it appears, and it says nothing was written.
- The generated mark is a note named Generated by AI. Accept and Override carry the cell label in their names, such as Accept suggestion for Northwind Traders, Industry, so a column of cells is not a column of identical buttons. The label prop is yours to write; an empty one degrades every name.
- The overwrite switch is described by its count sentence, so the number of filled cells it would change is read with the switch.
- Accepted and overridden cells have no live region. Their change is silent beyond focus moving to the value, so announce it in your own region if the table is long.

**Focus**

- Opening the popover moves focus into it; closing returns it to the header action.
- Accepting or saving an override removes the buttons that had focus, so focus moves to the cell value. If you replace the cell element entirely when the status changes, that move is lost and focus falls to the page.
- Cancel and Edit prompt return to the configuring state and leave focus on the page body until the next Tab, because the button that had focus is gone.

## Pitfalls

- Nothing here writes a value. If `onApply` resolves without storing suggestions on your side, the person sees the panel close and the column unchanged.
- Cancel aborts the signal passed to your callbacks and calls `onCancel`, but the component cannot undo what you already stored. Discard partial results yourself, or the cancelled run leaves suggestions behind.
- The preview runs on the first records in the order you pass, whether or not they are filled. With overwrite off, a preview row can show a suggestion for a cell the full run will skip; that is the existing value beside the result, working as intended.
- The failed message states that every existing value was kept. Make that true: stage results on your side and commit them after `onApply` resolves.
- Per-record cost and time appear only when your sample results include `cost` and `durationMs`. Omit them and the row shows neither, rather than a guess.

## Composition

- States: `configuring`, `sample-preview`, `applying`, `suggested`, `accepted`, `overridden`, `failed`
- Composes from this registry: ai-label, cost-chip
- shadcn primitives: button, input, label, popover, progress, select, switch, textarea
- npm: lucide-react

## Evidence

Attio, Clearfeed, Coda, Linear, LogicGate, Relay, Notion, Zapier
