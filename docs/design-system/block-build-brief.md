# Block build brief

Family O only. Read [`component-build-brief.md`](component-build-brief.md) first and treat it as
still binding **in full** — tokens, the axe gate, the guidance module's server/client split, JSX
entity escaping, story hygiene, the report shape. None of it is repeated here. This file records
only what a block does differently, and what O2 `chat-shell` — built alone by hand so the other
twelve would not each learn it — actually hit. Then read your block's entry in
[`block-specs.md`](block-specs.md), **including its prose**: the prose is normative.

## A block composes; it does not implement

This is the whole point of the layer. Your shell owns arrangement and nothing else: every region is
filled by an already-shipped component that keeps its own props, state model and accessibility
contract. The only hand-written markup in `chat-shell.tsx` is region wrappers and two small labelled
affordances the composed components had no prop for.

**When a composed component does not fit, report it — do not fork it.** O2 found three missing props
(§Traps); each was solved with a labelled sibling or a documented override, and written down. A
reimplemented thread row would have passed every gate.

## Your scope

Five files, same shape as a component, with three differences:

| File | Difference for a block |
| --- | --- |
| `registry/super-ai/<name>.test.tsx` | the scaffold is **state-driven**, so `states: []` gets **no** `expect.fail` stubs. Nothing starts red. Write the region test first, by hand |
| `components/demos/<name>-demo.tsx` | the shell is `h-full`; give the demo a bounded height (`className="h-[42rem]"`). Full-bleed rendering is automatic from `layer` — do nothing for it |
| `../storybook/.../<Pascal>.stories.tsx` | `layout: "fullscreen"` and an `h-svh` decorator — a block is a page, not a centred box. Mandatory `Empty` and `Responsive` exports |

`lib/catalog.manifest.ts` stays the integrator's. Your row already carries `layer: "block"`,
`regions`, `consumes` and `states: []`.

## Regions, not states

A shell is a layout, not a state machine, so it declares `regions` where a component declares
`states`. Every declared region must render as `data-region="<id>"`, kebab-case exactly as in the
manifest.

**Mount every region unconditionally**, even when empty; show the composed component's own empty
affordance instead. A region that appears from nowhere cannot teach that it exists, and a
conditional one forces you to weaken your own region test.

## The four gate assertions, and what each is worth

`check-contract.mts`'s block branch asserts: non-empty `consumes`; every declared region present in
source; an `Empty` story export; a `Responsive` story export. Two are weaker than they look.

1. **`consumes` non-empty — cannot tell composition from imitation.** A shell could declare eleven
   and import one. Close it yourself: §Prove the composition.
2. **`data-region` — a source `includes()`.** It passes on the string inside a comment, inside dead
   code, or on an element that never renders. Write the render-time version first:
   ```tsx
   const REGIONS = ["sidebar", "topbar", "message-stream", "artifact-cards", "composer"];
   it.each(REGIONS)("renders the %s region", (region) => {
     const { container } = render(<ChatShell />);
     expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
   });
   ```
3. **`Empty` — earns its mandate.** F4, O1 and O3 each say independently that the empty state is the
   view most users actually see. Writing O2's surfaced that the shell needed *three* independent
   empty affordances — sidebar, stream, artifact region — which nobody would have derived from the
   spec. O13 has three panes empty at once on first load.
4. **`Responsive` — proves nothing mechanically. Write it anyway; do not trust it.** The viewport
   addon's preview-side annotation contributes only `initialGlobals` and no decorator; all resizing
   happens in the manager, and the vitest runner behind `test:stories` has no manager. So axe checks
   `Responsive` at Chromium's default width, identically to any other story. Use the Storybook 9 API
   — `globals: { viewport: { value: "mobile" } }` plus explicit `parameters.viewport.options`;
   `parameters.viewport.defaultViewport` was removed in 9 and does nothing while looking configured
   — then **verify narrow layout by hand in a browser** and say so in your report. *Integrator:* a
   second vitest storybook project pinned to a mobile `instances[].viewport` would make this
   mechanical once for all thirteen. A container-width decorator is not a substitute — B1's drawer
   swap keys on a viewport media query.

## Prove the composition

O2's test file is the model answer. Assert against composed components' **own** `data-slot` values
and route interactions through their **own** controls, so swapping composition for hand-rolled
markup breaks a test rather than requiring a reviewer to notice it:

```tsx
it("composes B6 thread rows rather than rendering its own", () => {
  render(<ChatShell threadGroups={THREADS} activeThreadId="t1" />);
  expect(document.querySelectorAll('[data-slot="thread-list-item"]')).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Brand audit" })).toHaveAttribute("aria-current", "page");
});
```

Do this for every structurally load-bearing entry in `consumes`. Where a composed component exposes
no `data-slot` (AI Elements does not), assert the one observable that separates composing from
imitating — O2 pins `Message`'s `is-user`/`is-assistant` class, with a comment saying why a class
assertion is justified there and nowhere else.

## The `consumes` list you were handed is provisional

O2's brief listed eight components; the spec's prose required eleven — `D1/D3/D4 composer family`
was shorthand the list had dropped, and a shell with no composer is not that shell. Expand every
`X/Y/Z family` shorthand, read the prose for what `Filled by:` omits, and reconcile declared deps
against real imports before reporting; `check-contract` asserts
`registryDependencies.length === shadcn + external + consumes`, so the imports are the truth. Report
additions — do not edit the manifest.

**If your spec names another vendor's component**, `ManifestItem.external` takes absolute registry
URLs and spreads them into `registryDependencies`. "Not in `apps/docs`, therefore unreachable" is the
wrong conclusion; O13 hits this on the same AI Elements surfaces.

## Already fixed — do not fix again

`lib/catalog.manifest.test.ts` asserted non-empty `states` for every non-exempt shipped item and went
red the moment O2 flipped to `shipped`. **Task 5 fixed it once, for all blocks** — excluding
`layer === "block"` and adding a companion assertion that shipped blocks have non-empty `regions`,
non-empty `consumes` and **empty** `states`. Twelve agents patching that shared file concurrently is
a merge disaster. If it goes red for you, something else is wrong: report it.

## Your guidance is on your honour

`check-contract.mts:155` `continue`s out of the block branch **before** the docs-guidance content
assertions at `:180-193`. Blocks are checked for the *existence* of
`content/components/<name>.docs.tsx` and nothing about what is in it — a stub module with empty
`whyItMatters`, `dos`, `donts` and `pitfalls` ships green.

Fill it as if the gate checked, to `component-build-brief.md`'s §Guidance standard. `anatomy` is your
`data-region` list plus your own `data-slot`s, and **every pitfall should be something you actually
hit** — the composed-component gaps, the overrides you had to write, the thing that looked configured
but was not. `chat-shell.docs.tsx` has seven, all real. That is the bar.

## Traps O2 hit

- **B1 `app-sidebar` escapes its container.** Its desktop branch is `fixed inset-y-0 h-svh` — right
  when a shell owns the viewport, wrong in a docs preview or Storybook canvas, where it pins itself
  to the browser's left edge. Put `[contain:layout]` on the shell root: per CSS Containment that
  makes it the containing block for its own fixed descendants. **Unresolved consequence:** the
  sidebar keeps its `h-svh` and is clipped to the shell's height, so anything B1 bottom-anchors — its
  `promo` and `footer` slots — falls below the clip whenever the shell is shorter than the viewport,
  the default embedded case. Leave those slots empty unless your shell is viewport-tall. Affects O1,
  O9, O10, O11.
- **`npx shadcn add <third-party registry URL>` is unsafe here.** From `apps/docs` it resolves the
  item's own `registryDependencies` (`button`, `button-group`, `tooltip`) against the *default*
  registry and offers to overwrite this repo's Base UI primitives with Radix ones; non-interactively
  it hangs on the prompt, installs npm deps and **writes no component files**. Vendor by hand from
  the registry JSON.
- **AI Elements is Radix-flavoured; this registry is Base UI.** `message.tsx` needed two
  `asChild` → `render=` edits to typecheck. The patch is local — a consumer installing your block
  gets upstream's *unpatched* file, and nothing in the registry expresses "…but adapted". Disclose it
  as a pitfall. **Open architectural question:** either the repo forks AI Elements into its own
  registry items, or every Base UI consumer re-applies those edits.
- **AI Elements' `Conversation` does not scroll** without `scrollClassName="h-full overflow-y-auto"`
  (`use-stick-to-bottom` owns an element with no overflow set), and `ConversationContent` spreads
  `...props` onto the inner content div — so the region's tab stop and accessible name must sit on
  the `Conversation` root, which is not the element that scrolls. Latent
  `scrollable-region-focusable` failure for any stream genuinely empty of controls.
- **Composed components will be missing props your spec assumes.** B6 has no `running` (O2 renders a
  labelled `role="status"` sibling addressed by `data-thread-id`; O10 will want the same); D1 cannot
  be told "no negative prompt" — `negativePrompt={false}` only closes the panel; B7 has no leading
  slot for a sidebar trigger. Sibling or documented override, never a reimplementation, and write the
  gap down as a recommended source fix.
- **J4 `artifact-grid` columns key off the viewport, not the container**, so it over-columns inside a
  stream narrower than the window and clamps the excerpt the card is built around. Affects O7, O8, O9.
- **A call-site descendant variant (`[&_[data-slot=x]]:…`) is the house escape hatch** when a
  composed component's inner element is unreachable via `className`. Name it a documented constant
  with a "delete this when X lands" comment — do not inline it. Same idiom as `model-picker`'s
  `ENTITY_ROW_SELECTED_DESCRIPTION_FIX`.
- **Never pass `data-slot` to a registry component.** `data-region` and `data-<thing>-id` are fine;
  overriding a vendored `ui/` primitive's slot to get one addressable root is house idiom.
- **`role="status"` is not name-from-content** — `getByRole("status", { name })` never matches.
  Filter `getAllByRole("status")` by text.
- **`cn` last after a spread** — `<X {...caller} className={cn(mine, caller?.className)} />` — or a
  caller's className is silently swallowed.

## Report

Per `component-build-brief.md`, plus: your final `consumes` list and how it differs from the one you
were handed; every composed component whose props did not fit and what you did instead; and your
hand-verified narrow-viewport result, since `Responsive` cannot give you one.
