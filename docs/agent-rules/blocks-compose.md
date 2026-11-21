# Blocks compose, they do not implement

This rule protects the point of the block layer: every region is filled by a shipped component that keeps its own props, state model and accessibility contract.

A block owns arrangement and nothing else. When a composed component does not fit, use a labelled sibling or a documented override and report the gap. Never fork or reimplement the component inside the block.

The full account: `docs/design-system/block-build-brief.md` ("A block composes; it does not implement"), with the gaps recorded in `docs/CONTINUE.md` §8.

## What it costs

A reimplemented row passes every mechanical gate and is still wrong, because it drifts from the component it copied. The rule prevents that silent fork. Following it costs an author a visible workaround and a written gap report where a quiet copy would have been faster.
