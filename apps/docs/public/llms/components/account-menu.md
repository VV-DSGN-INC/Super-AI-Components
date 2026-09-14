# Account Menu

> The avatar menu in the corner of the shell: an identity block (avatar, name, email) on top, product actions in the middle, and sign-out last. Appearance — theme and background — lives in a nested submenu rather than a separate settings screen, so switching looks costs one hover, not a navigation.

Layer: component · Family: B · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/account-menu.json` · Contract: `components/super-ai/account-menu.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/account-menu

## Why it matters

Every reference product with a persistent account surface — Lovable, Claude, Spline, Midjourney — puts theme switching one level under the avatar, not behind a dialog or a settings page. Theme and background are toggled far more often than any other account setting, so the cost of reaching them has to be the lowest cost the menu system offers: a submenu, not a modal round-trip.

## When to reach for it

Reach for it as the single account surface in a shell — one instance per app, anchored top-right or in the sidebar footer. Pass `items` for product actions (Settings, Billing, …) with an optional `shortcut` on any row that has one; pass controlled `theme`/`onThemeChange` and `background`/`onBackgroundChange` for the Appearance submenu, and `onSignOut` for the always-last action. Don't split account actions across a second menu — if it belongs to the account, it belongs in this one, in the conventional order.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Keep the identity block on top and sign-out last, separated by rules — it's the order every one of these menus already uses, so don't reinvent it.
- Put Appearance behind a nested submenu, not a separate screen — theme and background are toggled constantly and shouldn't cost a navigation.

## Don't

- Don't move Appearance into a dialog — it turns the cheapest, most frequent setting in the menu into a modal round-trip.
- Don't render background options as bare colour swatches with no accessible name — colour alone doesn't tell a screen reader, or a colourblind user, which option is which.

## Anatomy

- `account-menu`: Root wrapper around the trigger and its menu.
- `account-menu-trigger`: The avatar button that opens the menu.
- `account-menu-avatar`: Avatar image or initials, reused on the trigger and in the identity block.
- `account-menu-identity`: Name + email block, always first in the open menu.
- `account-menu-item`: One product action row; shows a `kbd` hint when it carries a shortcut.
- `account-menu-appearance-trigger`: Opens the nested Appearance submenu — never a dialog.
- `account-menu-appearance-content`: The submenu popup holding theme and background controls.
- `account-menu-theme-item`: One theme option, exposed as a real `menuitemradio`.
- `account-menu-background-swatch`: One background option, exposed as a named radio, not colour alone.
- `account-menu-sign-out`: The sign-out action, always last, below a rule.

## Accessibility

**Keyboard**

- Closed, the whole component is one tab stop: the avatar trigger. Enter, Space or Down opens the menu, and from there Tab is the dismissal key rather than the navigation key — everything inside is reached with the arrows.
- Up and Down walk the rows, typing a letter jumps to a matching one, Right opens the Appearance submenu, Left closes it, and Escape closes whatever is open.
- The theme options are real `menuitemradio`s, so Up and Down both move and select. Choosing one deliberately leaves the menu open — a radio row does not close on click, unlike the `items` rows and sign-out, which do.
- The background swatches are a standalone `RadioGroup`, not menu items, so the menu's arrow walk never registers them and never lands on one. In practice they are pointer-only: there is no key that moves the highlight from the theme list onto the swatch row.
- `shortcut` is drawn, not bound. The component registers no key handler at all, so every hint it renders is a promise your own app has to keep.

**Screen reader**

- The trigger's whole name is `aria-label="Account menu for <user.name>"`. The avatar beside it — image or initials — is `aria-hidden`, so a blank or placeholder `name` leaves the only visible control on the surface effectively unnamed.
- The identity block is a plain `div`, not a menu item. Name and email never appear in the arrow-key walk; a screen reader meets them only when reading the popup as a document.
- Each background swatch is named by `aria-label={option.label}` and by nothing else — its colour contributes no name. A background option added without a `label` announces as an unnamed radio in a group of five.
- The `kbd` hints are `aria-hidden`, so a row with a shortcut announces exactly like a row without one.
- Sign-out's `variant="destructive"` is paint only. It announces identically to every other item, so the wording of `signOutLabel` is the only thing marking it as terminal.
- Nothing announces an outcome. Changing theme or background updates a radio's checked state and calls your handler; there is no live region, so the appearance change itself is silent.

**Focus**

- Closing the menu — by choosing a row, by Escape, or by clicking away — returns focus to the avatar trigger, so a decision never strands you at the top of the page.
- Left out of the Appearance submenu puts the highlight back on the Appearance row rather than dropping it.
- The trigger ships its own `focus-visible:ring-2`. Everything inside inherits the menu primitive's highlight styling, so a swatch focused by pointer shows the radio's own ring and not the menu's.

## Pitfalls

- Skipping the `shortcut` prop on a row that genuinely has a keyboard shortcut — an unlisted shortcut is a shortcut nobody learns, so the row must show it via `kbd`, not omit it for tidiness.
- Reaching for the menu's built-in radio item (with its filled-background checked state) for background swatches — the checked state has to be a border/ring so the swatch keeps showing its own colour. Use the standalone Radio primitive there, not `DropdownMenuRadioItem`.
- Forgetting the menu is controlled: `theme` and `background` don't change on their own when an item is selected — the consuming app owns them and must update state in `onThemeChange` / `onBackgroundChange`.

## Composition

- States: `theme-radio`, `background-swatches`, `shortcut-hints`
- Composes from this registry: initials, kbd
- shadcn primitives: dropdown-menu, radio-group
- npm: none

## Evidence

Lovable, Claude, Spline, Midjourney
