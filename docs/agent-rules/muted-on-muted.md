# Muted text on a muted surface

This rule protects text contrast, which has failed here for the same pairing in five separate rounds.

Never pair `text-muted-foreground` with `bg-muted`, `bg-accent` or `bg-secondary`: those backgrounds share a lightness in this token set and the pairing measures 4.34:1 against a 4.5:1 minimum. When a component paints such a surface, rebind the variable (`[--muted-foreground:var(--accent-foreground)]`) rather than restyling slots, because composed children carry their own muted classes and a slot-level override cannot reach them. `bg-muted/50` is not a safe workaround.

The full account: `docs/design-system/a11y-baseline.md` ("Recurring failure" and "The rule").

## What it costs

The static check catches only the single-element form; the cross-component form is found by `pnpm test:stories` or by a user. The rule prevents a contrast failure that passes review by eye. Following it costs one variable rebind on the surface, in place of a plain muted class.
