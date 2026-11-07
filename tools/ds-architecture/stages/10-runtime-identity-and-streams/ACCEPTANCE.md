---
appliesTo: [component-library]
claims: [10.1, 10.2, 10.3, 10.4]
---

# Stage 10 · Runtime identity and stream rendering · acceptance

Two things a shipped page should be able to say about itself: which component painted
each element, and which design system it came from. And for a library that renders
model output, one more: that every kind of part a model stream can carry has a
component waiting for it.

| Claim | Statement | Checked by |
|---|---|---|
| `10.1` | Every component file in the `components` role renders a `data-slot`, or is listed in `runtime.slotExempt` with a reason of at least 20 characters. Every exemption still applies: its file exists and renders no `data-slot`. | `acceptance.mjs` |
| `10.2` | `runtime.systemId` is declared, and a component file renders `data-ds` carrying that id. | `acceptance.mjs` |
| `10.3` | The parts renderer at `runtime.partsRenderer` names every UI part type in `reference/ui-part-types.json`, both prefixes included, and carries a `never` exhaustiveness guard. | `acceptance.mjs`; **not applicable** when `runtime.partsRenderer` is not declared |
| `10.4` | Every recorded stream in `reference/streams/` is replayed: its id appears in a file of the `stories` role. | `acceptance.mjs`; **not applicable** when `runtime.partsRenderer` is not declared |

## What counts as a component file

A `.tsx` or `.jsx` file resolved from the `components` role, minus stories, tests and
specs, minus any file whose name starts with `_` (fixtures, icon barrels). The probe
reads source text, so "renders a `data-slot`" means the file writes the attribute
(`data-slot="…"` or a `"data-slot":` key). It cannot tell whether the slot lands on the
root element; that would need the target's renderer. A component whose only output is
another component, or no DOM at all, takes an exemption and says why.

## Why an exemption has to keep applying

A `slotExempt` entry for a file that now renders a slot, or for a file that was deleted,
is a hole cut in the gate for nothing. The next component written under that name
inherits the hole. So a stale exemption is unmet, the same way a short reason is.

## Why `data-ds` is declared once

Every component writing the system id would be noise in every element and a second
thing to keep in sync. One element carrying `data-ds` (in practice the root provider,
writing it onto `<html>`) is enough for the census to attribute every slot under it.
Pages that mix two systems nest a second `data-ds`, and the census attributes by the
nearest one.

## Why 10.3 and 10.4 key on `runtime.partsRenderer`

Most component libraries render no model output, and demanding a parts renderer from
them would make the stage unreachable for no reason. Declaring `runtime.partsRenderer`
is the library saying "I render model streams". From then on both claims apply, and
removing the key to go green shows up in the config diff, like narrowing a profile.

## Fixtures

`__fixtures__/conformant/` meets all four claims. `__fixtures__/conformant-no-ai/`
meets 10.1 and 10.2 and reports 10.3 and 10.4 as not applicable.

`__fixtures__/nonconformant/` holds trees that each break exactly one claim:
`missing-slot` (10.1), `short-exemption-reason` (10.1), `stale-exemption` (10.1),
`no-system-id` (10.2), `system-id-not-rendered` (10.2), `renderer-missing-part` (10.3),
`renderer-without-never` (10.3), `stream-not-replayed` (10.4).
