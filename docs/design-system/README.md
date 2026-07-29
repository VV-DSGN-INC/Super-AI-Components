# Super-AI-Components — design system documentation

**Status:** Proposed. Not yet approved; supersedes nothing until §5 of the
[design spec](../superpowers/specs/2026-06-10-super-ai-components-design.md) is formally replaced.
**Date:** 2026-07-28

This directory documents a re-derivation of the component catalog from a reference board of real AI
products, together with the concept model, per-component requirements, and the Figma artifacts that
visualise them.

## Why this exists

The approved design spec defines a 109-item catalog organised by **modality kit** (writing, image,
audio, video). Analysis of the reference board showed that organisation hides duplication: the
Writing, Image, Audio and Video kits are four descriptions of the same three components with
different content poured in.

This documentation re-cuts the catalog along the two axes the reference board is actually organised
by — **app type** and **pattern type** — and applies one inclusion test throughout:

> A component earns registry status only if it appears in **three or more unrelated products** on
> the reference board. Anything appearing in one product is a demo, not a registry item.

The result is the same order of magnitude (110 items) with a different composition: more primitives,
far fewer near-duplicate leaves, and 14 layout archetypes instead of 4.

## Documents

| File | Contents |
| ---- | -------- |
| [reference-board-analysis.md](reference-board-analysis.md) | What the reference board contains, section by section; the products observed; the anatomy extracted from each app type and pattern family |
| [concept-model.md](concept-model.md) | The layer model (L0–L4), primitive fan-out, the asset lifecycle loop, and the six cross-cutting contracts |
| [catalog.md](catalog.md) | The full 110-item catalog: name, purpose, key states/variants, shadcn base, per family |
| [component-specs.md](component-specs.md) | Per-component design requirements for families A–N (96 items: 12 primitives + 84 components) |
| [block-specs.md](block-specs.md) | Per-block requirements for family O — the 14 layout archetypes |
| [figma-board-map.md](figma-board-map.md) | What lives where on the Figma boards, and how to navigate them |
| [decisions.md](decisions.md) | Decisions taken, decisions still open, and a revised sequencing proposal |
| [gaps.md](gaps.md) | **What the catalog is missing** — 7 recovered omissions, 5 trust/control components, and 20 unsampled AI types. Also the sampling-bias limitation of the whole method |

## Reading order

- **To review the proposal:** [concept-model.md](concept-model.md) → [catalog.md](catalog.md) → [decisions.md](decisions.md)
- **To implement a component:** [catalog.md](catalog.md) for the summary → [component-specs.md](component-specs.md) for its requirements → the Figma card for its wireframe
- **To understand where it came from:** [reference-board-analysis.md](reference-board-analysis.md)

## Relationship to the existing spec

Unchanged from the approved spec: the AI Elements relationship (companion registry, never a fork),
registry mechanics, the layer model, API conventions, the dev workflow, and the non-goals.

Changed: §5 (the catalog) and §11 (implementation sequencing). See [decisions.md](decisions.md).

## Source material

- Reference board: [AI Component LIst](https://www.figma.com/design/PnRO0vJFr1q9Q6Mi6VY0lr/AI-Component-LIst) (Figma design file)
- Working board: [AI-Components-Thinking](https://www.figma.com/board/6QSzRk2FCCfpfrYpo3SmjD/AI-Components-Thinking) (FigJam) — wireframes, concept map, detailed cards
