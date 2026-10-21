# Data Controls

> A settings card for what happens to a person's data: one row for model training, one row for how long conversations are kept. Each row has a plain-language description, one sentence saying what happens to the data under the setting as it stands now, and a link to the long policy. Plan limits, admin policies and products that collect nothing are states of the same rows, so the section never silently disappears.

Layer: component · Family: N · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/data-controls.json` · Contract: `components/super-ai/data-controls.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/data-controls

## Why it matters

Data ownership is where users decide whether to trust an AI product, and the reference products handle it unevenly: ChatGPT pitches training as altruism, Claude, Gemini, GitHub, Notion and Perplexity bury the opt-out a few menus deep, Figma and Substack lock it behind plans or workspace admins, and Limitless, which does not train, says so on the page. Shape of AI's data-ownership pattern asks for the same things this component builds in: separate controls, the trade stated on both sides, and the default visible in the interface rather than only in the policy.

## When to reach for it

Pass `training` and, if the product has a retention choice, `retention`. Both are controlled: you own `checked` and `value` and update them in the handlers. Write `effect` for the current value, so it changes when the control does. Put the trade in `description`: what the person gives, and what they get back. Set `kind` on a row only when the setting is not freely editable: `plan-locked` with the plan name and `onUpgrade`, `admin-managed` with the policy and a contact, or `none-collected` with the reason there is nothing to toggle. When the person asks to upgrade, open your own paywall message from `onUpgrade`; this component does not render one.

## Variants

None: No variant axis: the six states are driven by the data, through checked, value and each row's kind.

## Instead use

- **settings-dialog**: You need the whole settings surface with navigation and many sections. Data-controls is one section's worth of rows and lives inside that surface.
- **member-gate-row**: A single feature is locked behind a plan and has nothing to do with data handling. Data-controls only uses the lock for its own two rows.
- **connection-manager**: The person is supplying their own API keys or pointing at a local model. That is a connection, not a data-handling choice.
- **disclaimer-note**: You only need a caveat sentence under an answer or field. A note has no control; data-controls exists to hold one.

## Do

- State what happens to the data right now, in one sentence next to the control, and update that sentence when the control changes.
- Keep training and retention as two rows with two controls, so changing one cannot change the other.
- Leave a plan-limited setting in the list with the lock, the plan name and an upgrade action.
- Render the section even when nothing is collected, and say why there is no switch.
- Show an administrator-set policy with its value and who to ask, on a row that stays in place.

## Don't

- Don't ship a switch with a label and nothing else. A toggle with no description is a setting nobody changes.
- Don't fold training and retention into one switch. Turning off training should not delete history, and keeping history should not opt anyone in.
- Don't hide the section from people who cannot change it. Silence reads as "no controls exist" rather than "your plan or admin sets this".

## Anatomy

- `data-controls`: The card. A named group, so a screen reader announces the section.
- `data-controls-title`: Section title. A heading whose level you set with `headingLevel`.
- `data-controls-row`: One setting. Carries `data-row` (training or retention) and `data-kind`.
- `data-controls-row-label`: The setting's name. It is also the accessible name of the control.
- `data-controls-row-description`: What the setting trades. Required text, never optional.
- `data-controls-training-switch`: The training control. Absent in `none-collected`.
- `data-controls-retention-trigger`: The retention period select. Absent in `none-collected`.
- `data-controls-effect`: One sentence on what happens to the data right now. A polite live region.
- `data-controls-link`: Link to the long version of the policy.
- `data-controls-plan`: Lock and plan name, in text. Only in `plan-locked`.
- `data-controls-upgrade`: Calls `onUpgrade`. Only in `plan-locked` when you pass the callback.
- `data-controls-policy`: The administrator's policy and who to ask. Only in `admin-managed`.
- `data-controls-reason`: Why there is no control. Only in `none-collected`.

## Accessibility

**Keyboard**

- One tab stop per editable control: the switch and the retention select (Enter or Space opens it), then one stop for each row's policy link. In `plan-locked` the Upgrade button is an extra stop.
- `plan-locked` and `admin-managed` render the switch and select natively disabled, which removes them from the tab order. The policy link and Upgrade button stay reachable, so the explanation is never behind an inert control.
- `none-collected` has no control to reach; the only stop in that row is the policy link.
- Space and Enter both toggle the switch. Escape closes the open select and does nothing else.

**Screen reader**

- The section is a `group` named by its title, and the title is a heading at the level you pass in `headingLevel`.
- The switch and the select are named by `aria-labelledby` pointing at the row label; the select's name also includes its own value, so a closed select reads as "Keep my chats, 30 days".
- Both controls carry `aria-describedby` pointing at the description and the effect sentence, and in `plan-locked` and `admin-managed` also at the lock or policy line, so the reason a control is inert is announced with it.
- The effect sentence sits in a polite live region, so flipping the switch announces the new sentence. The select does not move focus, so the new retention sentence is read after the change is committed.
- The policy link's name is the visible link text plus the row label ("Read the full policy: Keep my chats"), so two rows never expose two identical links. A custom `learnMoreLabel` stays a prefix of that name.
- The plan and the lock are text ("Pro", "Changing this needs the Pro plan."); the padlock icon is hidden from assistive tech. Disabled controls are not conveyed by dimming alone.

## Pitfalls

- Computing `effect` once. It is a plain string, so if you pass a constant it keeps describing the old setting after the person flips the switch. Derive it from the same value you pass as `checked`.
- Wiring `onUpgrade` to a modal that this component renders. It renders none: call your own paywall message from the callback.
- Passing `kind: "plan-locked"` and expecting `onCheckedChange` to fire anyway. The switch is disabled in that state, so the handler never runs; use `onUpgrade`.
- Putting memory or saved-context controls in this card. They are personal caches rather than data ownership, and belong in their own surface.
- Pairing `text-muted-foreground` with a muted, accent or secondary surface when you wrap the card. The rows are written for the card surface; if you paint the wrapper, rebind `--muted-foreground` on it.

## Composition

- States: `training-on`, `training-off`, `retention`, `plan-locked`, `none-collected`, `admin-managed`
- Composes from this registry: entity-row
- shadcn primitives: badge, button, card, select, switch
- npm: lucide-react

## Evidence

ChatGPT, Claude, Gemini, GitHub, Notion, Perplexity, Substack, Figma, Limitless
