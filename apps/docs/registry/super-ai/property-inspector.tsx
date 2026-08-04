"use client";

import * as React from "react";

import { FieldRow } from "@/registry/super-ai/field-row";
import { ResetAffordance, type ResetAffordanceState } from "@/registry/super-ai/reset-affordance";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { cn } from "@/lib/utils";

/**
 * Property Inspector — Object styling rows
 *
 * Spec: docs/design-system/component-specs.md#i2-property-inspector
 * States: per-element-type · grouped-sections · reset · empty
 *
 * Built on A6 `field-row` and A11 `reset-affordance` (via A5 `section-header`
 * for the collapsible group headers). Three spec sentences are load-bearing
 * and are enforced here rather than left to the call site:
 *
 * 1. "Content is selection-driven: one variant per element type, plus an empty
 *    state." `sections` is keyed *by element type*, so switching selection is a
 *    data lookup — a consumer never branches on element type to decide what to
 *    render.
 * 2. "Group-level reset on the section header; row-level reset at the end of
 *    each A6 row." Both scopes exist and neither substitutes for the other:
 *    `PropertySection.onReset` is A11 at `scope="group"` inside the header,
 *    and `PropertyRow` always renders A11 at `scope="row"` in `FieldRow`'s
 *    `reset` slot — disabled at default, never removed, so the row never
 *    reflows as values drift.
 * 3. "Sections remember collapsed state per element type." Collapsing Layout
 *    for a text object must not collapse it for an image, so the open map is
 *    keyed `elementType -> sectionId -> open` and re-read on every selection
 *    change.
 */

interface PropertySection {
  /** Stable within an element type. Also the key the collapsed memory is stored under. */
  id: string;
  /** Section heading, e.g. "Layout". */
  label: string;
  /**
   * Group-scope A11 state. `modified` lights the header reset; `keyframed`
   * marks a group driven by animation rather than a static value.
   */
  state?: ResetAffordanceState;
  /** Clears every row in the section. Omit for a section with nothing resettable. */
  onReset?: () => void;
  /** Sections open by default; pass `false` for the ones that are usually noise. */
  defaultOpen?: boolean;
  /** The rows — normally `PropertyRow`s. */
  content: React.ReactNode;
}

interface PropertyInspectorProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Panel heading. */
  title?: React.ReactNode;
  /**
   * The type of thing selected on the canvas — "text", "image", "shape". The
   * caller names these; the inspector only uses the value to pick a variant and
   * to scope collapsed memory. `undefined` or `null` means nothing is selected.
   */
  elementType?: string | null;
  /** What is selected, e.g. "Heading". Announced when the selection changes. */
  selectionLabel?: React.ReactNode;
  /**
   * Sections per element type. The element type is the key, so the variant is
   * data rather than a fork at the call site.
   */
  sections?: Record<string, PropertySection[]>;
  /** What the header's status line reads when nothing is selected. */
  emptyTitle?: string;
  /** The one line of the empty body — what to do, not an apology. */
  emptyDescription?: string;
  /**
   * Rows that stay useful with nothing selected — canvas size, background,
   * grid. An inspector with no selection is the default view of an editor, not
   * a dead panel (decisions.md F4).
   */
  emptyContent?: React.ReactNode;
  /** Fires with the element type that scopes the memory, so a host can persist it. */
  onSectionOpenChange?: (elementType: string, sectionId: string, open: boolean) => void;
}

function PropertyInspector({
  title = "Properties",
  elementType,
  selectionLabel,
  sections = {},
  emptyTitle = "Nothing selected",
  emptyDescription = "Select an object on the canvas to edit its properties.",
  emptyContent,
  onSectionOpenChange,
  className,
  children,
  ...props
}: PropertyInspectorProps) {
  // elementType -> sectionId -> open. Keyed by type so a collapse decision
  // taken while a text object was selected does not follow the user to an
  // image, and is still there when they come back.
  const [openByType, setOpenByType] = React.useState<Record<string, Record<string, boolean>>>({});

  const activeType = elementType ?? null;
  const activeSections = activeType ? (sections[activeType] ?? []) : [];

  const isOpen = (section: PropertySection) =>
    (activeType ? openByType[activeType]?.[section.id] : undefined) ?? section.defaultOpen ?? true;

  const setOpen = (section: PropertySection, next: boolean) => {
    if (!activeType) return;
    setOpenByType((prev) => ({
      ...prev,
      [activeType]: { ...prev[activeType], [section.id]: next },
    }));
    onSectionOpenChange?.(activeType, section.id, next);
  };

  return (
    <div
      data-slot="property-inspector"
      data-element-type={activeType ?? undefined}
      // Deliberately not `role="region"`: a docs page or an editor with more
      // than one inspector would then carry several identically-named
      // landmarks, which axe fails on `landmark-unique`. The heading is what
      // names the panel.
      className={cn("bg-background w-full space-y-2", className)}
      {...props}
    >
      <div data-slot="property-inspector-header" className="flex items-baseline justify-between gap-2 pb-1">
        <h3 data-slot="property-inspector-title" className="text-foreground text-sm font-semibold">
          {title}
        </h3>
        {/*
          The selection summary is the only thing that tells you which variant
          you are looking at, so it announces rather than silently swapping.
        */}
        <p
          data-slot="property-inspector-selection"
          role="status"
          className="text-muted-foreground min-w-0 truncate text-xs"
        >
          {activeType ? (selectionLabel ?? activeType) : emptyTitle}
        </p>
      </div>

      {activeType ? (
        <div data-slot="property-inspector-sections" className="divide-border divide-y">
          {activeSections.map((section) => (
            <PropertyInspectorSection
              key={section.id}
              section={section}
              open={isOpen(section)}
              onOpenChange={(next) => setOpen(section, next)}
            />
          ))}
        </div>
      ) : (
        <div data-slot="property-inspector-empty" className="space-y-3">
          {/*
            The header's status line already names the state, so the body does
            not repeat it — it says what to do instead, and then hands over to
            whatever stays editable with nothing selected.
          */}
          <p data-slot="property-inspector-empty-description" className="text-muted-foreground text-sm">
            {emptyDescription}
          </p>
          {emptyContent ? (
            <div data-slot="property-inspector-empty-content" className="space-y-3 pt-1">
              {emptyContent}
            </div>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}

function PropertyInspectorSection({
  section,
  open,
  onOpenChange,
}: {
  section: PropertySection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const state = section.state ?? "default";
  const resettable = section.onReset !== undefined || state !== "default";

  return (
    <div
      data-slot="property-inspector-section"
      data-section-id={section.id}
      data-state={open ? "open" : "closed"}
      className="py-1"
    >
      <SectionHeader
        size="sm"
        title={section.label}
        collapsible
        open={open}
        onOpenChange={onOpenChange}
        action={
          resettable ? (
            open ? (
              <ResetAffordance
                scope="group"
                state={state}
                onReset={section.onReset}
                label={`Reset ${section.label}`}
              />
            ) : (
              // A11 degrades a collapsed group's reset to a dot, so changes
              // hidden behind a collapsed header still signal. The dot is
              // aria-hidden and its meaning is otherwise carried by colour
              // alone, so the same fact is stated in text for screen readers.
              <>
                <ResetAffordance scope="group" state={state} collapsed />
                {state !== "default" ? <span className="sr-only">{section.label} modified</span> : null}
              </>
            )
          ) : undefined
        }
      />
      {open ? (
        <div data-slot="property-inspector-section-rows" className="space-y-3 pt-1 pb-3">
          {section.content}
        </div>
      ) : null}
    </div>
  );
}

interface PropertyRowProps extends Omit<React.ComponentProps<"div">, "children"> {
  label: string;
  /** Always-visible explanatory text, wired to the control via aria-describedby. */
  hint?: string;
  /** Row-scope A11 state. `modified` enables the reset; `keyframed` marks an animated value. */
  state?: ResetAffordanceState;
  onReset?: () => void;
  /** Defaults to `Reset <label>` — several rows with the accessible name "Reset" are unusable. */
  resetLabel?: string;
  children: (controlId: string, describedBy?: string) => React.ReactNode;
}

/**
 * One property. A6 `field-row` for the label/control/hint grid, with A11 at
 * row scope permanently occupying its `reset` slot — the row-level half of the
 * spec's two reset scopes.
 */
function PropertyRow({ label, hint, state = "default", onReset, resetLabel, children, ...props }: PropertyRowProps) {
  return (
    <FieldRow
      label={label}
      hint={hint}
      reset={<ResetAffordance state={state} onReset={onReset} label={resetLabel ?? `Reset ${label}`} />}
      {...props}
    >
      {children}
    </FieldRow>
  );
}

export { PropertyInspector, PropertyRow };
export type { PropertyInspectorProps, PropertyRowProps, PropertySection };
