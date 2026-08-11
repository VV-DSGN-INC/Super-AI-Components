"use client";

import * as React from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   The two preference axes behind P1 `data-views` and P2 `detail-view-shell`.

   Both components are fully controlled and never persist anything themselves —
   the registry's rule is that a component emits and the host stores. This
   contract is the *optional* host-side half: a consumer with server-side
   preferences installs the components, skips this file, and wires its own.

   Collection axis  how a list presents itself, keyed per section
   Record axis      how one record opens, keyed per entity

   The axes never consult each other. A section can be a table whose rows open
   in a popup while another is a board opening into an overlay.
   ─────────────────────────────────────────────────────────────────────────── */

// ---------------------------------------------------------------------------
// Collection axis
// ---------------------------------------------------------------------------

export type ViewMode = "list" | "kanban" | "table" | "calendar" | "timeline";

/** Order is the switcher's order and its arrow-key order. Time views go last. */
export const VIEW_MODE_VALUES = ["list", "kanban", "table", "calendar", "timeline"] as const;

/** The views that require a date per item. */
export const TIME_VIEW_MODES: readonly ViewMode[] = ["calendar", "timeline"];

export const VIEW_MODE_DEFAULT: ViewMode = "kanban";

export function isViewMode(value: unknown): value is ViewMode {
  return typeof value === "string" && (VIEW_MODE_VALUES as readonly string[]).includes(value);
}

/**
 * Which views a section may offer. Showing a view that can only render empty
 * is worse than not offering it at all, so a section without a date accessor
 * never sees the time views.
 */
export function availableViewModes(timeCapable: boolean): readonly ViewMode[] {
  if (timeCapable) return VIEW_MODE_VALUES;
  return VIEW_MODE_VALUES.filter((mode) => !TIME_VIEW_MODES.includes(mode));
}

export const VIEW_MODE_STORAGE_KEY = (section: string): string => `super-ai.view-mode.${section}`;

// ---------------------------------------------------------------------------
// Record axis
// ---------------------------------------------------------------------------

/**
 *   popup       centred Dialog over a dimmed collection
 *   overlay     right-side Sheet, collection still live behind it
 *   fullscreen  a real route, which is the only mode that owns a URL
 *
 * D18 found these three already shipped in Notion, under the names center
 * peek, side peek and full page.
 */
export type DetailMode = "popup" | "overlay" | "fullscreen";

export const DETAIL_MODE_VALUES = ["popup", "overlay", "fullscreen"] as const;

/**
 * Overlay, because it is the only mode that demonstrates content swapping when
 * a second record is opened — the best first run for a user who has never seen
 * the axis exists.
 */
export const DETAIL_MODE_DEFAULT: DetailMode = "overlay";

export function isDetailMode(value: unknown): value is DetailMode {
  return typeof value === "string" && (DETAIL_MODE_VALUES as readonly string[]).includes(value);
}

export const DETAIL_MODE_STORAGE_KEY = (entity: string): string => `super-ai.detail-mode.${entity}`;

// ---------------------------------------------------------------------------
// usePersistedPreference — one localStorage-backed preference
// ---------------------------------------------------------------------------

/**
 * Reads lazily on mount, re-reads when the key changes, writes through on
 * change, and listens for `storage` events so a change in one tab lands in the
 * others.
 *
 * Values are strings, because that is all localStorage stores: `T extends
 * string` makes a non-string instantiation a compile error rather than a
 * preference that silently never persists.
 *
 * Every window/localStorage touch is guarded, so the hook is inert on a server
 * and never throws when storage is disabled, full, or in private mode — it
 * just stops persisting. That is what makes it safe in a Next app.
 *
 * **Single-owner rule.** `storage` events do not fire in the tab that wrote the
 * value, so two hook instances sharing a key in the same tab will drift. A
 * given key must be owned by exactly ONE instance and its value threaded down
 * as props. This is not a caveat about the hook — it is the reason P1 and P2
 * take `viewMode` and `mode` as props instead of calling this themselves.
 */
function read<T extends string>(key: string, fallback: T, isValid: (v: unknown) => v is T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    if (isValid(stored)) return stored;
  } catch {
    // Storage unavailable — fall through to the default.
  }
  return fallback;
}

export function usePersistedPreference<T extends string>(
  key: string,
  fallback: T,
  isValid: (v: unknown) => v is T,
): [T, (next: T) => void] {
  const [value, setValue] = React.useState<T>(() => read(key, fallback, isValid));

  // useState's lazy initialiser runs once per mount, so a changed `key` would
  // otherwise leave `value` holding the previous key's value — and the next
  // set() would write that stale value into the new key. Re-read during render
  // rather than in an effect, so no frame ever paints the wrong key's value.
  const [readKey, setReadKey] = React.useState(key);
  if (readKey !== key) {
    setReadKey(key);
    setValue(read(key, fallback, isValid));
  }

  // The listener depends on `fallback` and `isValid` but must not resubscribe
  // when they change identity — an inline arrow from a caller would otherwise
  // tear down and re-add the listener on every render.
  //
  // The refs are refreshed in an effect rather than assigned during render.
  // Upstream assigned inline, which `react-hooks` rejects outright ("cannot
  // access refs during render") — and the rule is right, because a ref written
  // during render is invisible to the compiler's memoisation. An effect with no
  // dependency array runs after every commit, and a `storage` event can only
  // arrive from the task queue afterwards, so the listener never reads a stale
  // value. The initial values come from useRef itself, so the first render is
  // already correct.
  const fallbackRef = React.useRef(fallback);
  const isValidRef = React.useRef(isValid);
  React.useEffect(() => {
    fallbackRef.current = fallback;
    isValidRef.current = isValid;
  });

  const set = React.useCallback(
    (next: T) => {
      setValue(next);
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Write failed — in-memory state is still correct.
      }
    },
    [key],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    function onStorage(event: StorageEvent) {
      if (event.key !== key) return;
      // Another tab removed the key (or cleared storage): `newValue` is null.
      // Fall back rather than keeping a value that no longer exists.
      if (event.newValue === null) {
        setValue(fallbackRef.current);
        return;
      }
      if (isValidRef.current(event.newValue)) setValue(event.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [value, set];
}

// ---------------------------------------------------------------------------
// The two axes
// ---------------------------------------------------------------------------

export interface UseViewModeOptions {
  /** True when the section's config supplies getDateRange + renderChip. */
  timeCapable?: boolean;
}

/**
 * The collection-axis preference, validated against what this section actually
 * offers.
 *
 * Returns the available list as a third member so a page has one source of
 * truth to hand to the switcher. Two-element destructuring still works.
 *
 * `section` is a plain string here rather than a closed union, because a
 * registry cannot know a consumer's sections. Declare your own union and pass
 * it — `useViewMode<Section>("tasks")` — so a typo is a compile error instead
 * of a silently fresh preference under a misspelt key:
 *
 * ```ts
 * type Section = "tasks" | "projects";
 * const [mode, setMode, available] = useViewMode<Section>("tasks", { timeCapable: true });
 * ```
 */
export function useViewMode<S extends string = string>(
  section: S,
  options: UseViewModeOptions = {},
): [ViewMode, (mode: ViewMode) => void, readonly ViewMode[]] {
  const { timeCapable = false } = options;

  // Derived from a boolean rather than accepted as an array: an inline array
  // from a caller would be a fresh reference every render and resubscribe the
  // validator on each one.
  const available = React.useMemo(() => availableViewModes(timeCapable), [timeCapable]);

  const isAvailable = React.useCallback(
    (value: unknown): value is ViewMode => isViewMode(value) && available.includes(value),
    [available],
  );

  const fallback = available.includes(VIEW_MODE_DEFAULT) ? VIEW_MODE_DEFAULT : available[0];
  const key = VIEW_MODE_STORAGE_KEY(section);
  const [viewMode, setViewMode] = usePersistedPreference(key, fallback, isAvailable);

  // usePersistedPreference falls back in memory but leaves the stale string in
  // storage. Rewrite it, so a section that later regains its date accessor does
  // not silently snap back to a view the user abandoned.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null && !isAvailable(stored)) setViewMode(viewMode);
    } catch {
      // Storage unavailable — nothing to reconcile.
    }
  }, [key, isAvailable, viewMode, setViewMode]);

  return [viewMode, setViewMode, available];
}

/**
 * The record-axis preference, keyed per entity.
 *
 * `fallback` is a parameter rather than a per-entity constant map because a
 * registry has no entity list to build one from. D18 recorded a real gap here:
 * Notion derives this default from the *collection layout* (its board and
 * table views default to side peek, gallery and calendar to center peek),
 * where this takes one constant. One product is not three, so it is not
 * adopted — but a consumer wanting that behaviour can pass a fallback computed
 * from its current ViewMode, which is the whole fix.
 */
export function useDetailMode<E extends string = string>(
  entity: E,
  fallback: DetailMode = DETAIL_MODE_DEFAULT,
): [DetailMode, (mode: DetailMode) => void] {
  return usePersistedPreference(DETAIL_MODE_STORAGE_KEY(entity), fallback, isDetailMode);
}
