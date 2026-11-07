# Stage 10 · Runtime identity and stream rendering

**Date:** 2026-10-19
**Status:** built

## Problem

A design system ships components, and then it cannot see them. Which components does a
live app actually use? Which ones does nothing render? Nobody can answer without reading
every app's source, so unused components stay and nobody notices gaps in adoption.

Libraries that render model output have a second blind spot. A model stream carries
several kinds of part (text, reasoning, sources, files, tool calls, custom data), and a
part with no component renders as raw text or as nothing. Neither failure throws. The
reader just gets a worse answer.

A production AI playground reviewed on 2026-10-19 showed both sides: every element there
carried the name of the component that painted it, which made a full census possible from
outside, while its model-output rendering dropped list markers and set the reasoning trace
louder than the answer.

## Non-goals

- Proving a slot sits on the root element. That needs the target's renderer; the probe
  reads source.
- Analytics. The census counts what a page renders. It records nothing about people.
- Recording streams from a live model in this repo. The fixtures come from the SDK's real
  pipeline over a scripted model, so they are deterministic and free; a target can point
  `reference/record-streams.ts` at its own provider.
- Supporting a model SDK other than the Vercel AI SDK. The part list is that SDK's.

## The shape

An optional `runtime` block in `ds-architecture.config.json`:

```json
"runtime": {
  "systemId": "weeeha-ui",
  "slotExempt": [{ "file": "src/components/theme-provider.tsx", "reason": "renders no DOM of its own; sets data-ds on <html>" }],
  "partsRenderer": "src/components/ai/message-parts.tsx"
}
```

- `systemId`: the id written into `data-ds`, lowercase and hyphenated.
- `slotExempt`: component files that legitimately render no `data-slot`, each with its why.
- `partsRenderer`: present only in libraries that render model output; switches on claims
  10.3 and 10.4.

And one command that reads the identity back off a page:

```bash
ds-architecture census <page.html | url> [--target <repoRoot>] [--json]
```

It counts every `data-slot` on the page, grouped under the nearest `data-ds`. With
`--target` it also lists the slots that system declares and the page never rendered.
It reads HTML only, because the runner may import nothing outside Node: a URL is fetched
as served, so a client-rendered app is snapshotted by the target's own browser runner first
and the file is passed in.

## Decisions taken

| Decision | Choice | Why |
|---|---|---|
| Stage number | 10, after the ladder's 00 to 09 | Stage 04 is already designed (component meta contracts) and owes its reference code to upstream; overwriting it would relitigate a recorded decision |
| Profile | `component-library` only | A tokens-only system has no components, and an app consumes slots it did not author |
| Identity attribute | `data-slot`, the shadcn convention | Targets on the declared stack already write it; a second naming attribute would duplicate it |
| System attribute | One `data-ds`, nearest ancestor wins | Writing the id on every element is noise and a sync burden |
| Exemptions | Reason of 20+ characters, and must still apply | Same rule as stage 04's `coverageSkips`; a stale exemption is a hole for the next file |
| Stream claims | Applicable only with `runtime.partsRenderer` | Most libraries render no model output; the config key is the declaration |
| Part list | `reference/ui-part-types.json`, versioned | The probe needs the list as data, and an SDK major bump is a reviewed edit |
| Census input | HTML text or a fetched URL | A browser driver is a dependency the runner must not carry |
| Fixtures | SDK pipeline over a scripted model | Byte-identical across runs, no key, no cost; the chunk protocol is still the SDK's own |

## Rejected alternatives

- **Claims 7 and 8 of stage 04.** Mixes a runtime fact into the meta-contract stage and
  leaves stage 04 half-built.
- **A build plugin that tags every element** (the FullStory and Sentry annotate plugins).
  Works for any React app, but adds a dependency to the target's build for an attribute
  shadcn-based libraries already write by hand.
- **Census through a headless browser in the runner.** Correct for client-rendered apps,
  but a Playwright import breaks the dependency-free rule, and the gate exists because a
  probe importing a package fails in a target that never installed it.
- **Hand-written stream fixtures.** Faster, but a fixture invented by hand drifts from what
  the SDK actually sends, which is the gap the fixtures exist to close.
