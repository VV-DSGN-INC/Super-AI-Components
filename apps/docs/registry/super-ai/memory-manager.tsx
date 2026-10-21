"use client";

import { BrainCircuit, Check } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Memory Manager — What the AI remembers about a person, with scope, edit, delete and reset.
 *
 * Spec: docs/design-system/component-specs.md#n17-memory-manager
 * States: empty · populated · scoped · just-saved · editing · memory-off · reset-confirm
 *
 * There is no variant axis. The seven states are what the data and the host say:
 * `memories` empty or not, `scope` on each item, `justSavedId`, `defaultEditingId`,
 * `enabled`, and `defaultResetOpen`.
 *
 * Decisions from the spec that tests pin:
 *
 * 1. **Never a black box.** Every row states its scope, when it was added and,
 *    when the host knows it, where it came from, all as text.
 * 2. **Preferences and facts are two labelled groups**, in that order, because
 *    they are reviewed differently.
 * 3. **Scope is visible.** Global or one workspace, and with `activeWorkspace`
 *    set a row says whether it is used right now.
 * 4. **Edit is in place** with a labelled field and Save/Cancel. Delete is per
 *    row. Reset all sits behind an alert dialog that says what it deletes and
 *    what it keeps, and `onReset` fires only on confirm.
 * 5. **`MemorySavedChip` is its own export** with its own data-slot. The host
 *    renders it in the conversation at the capture moment; the manager never does.
 * 6. **`memory-off` is a switch plus one sentence** about what stops. Private
 *    sessions are named in copy only: L3 components never import each other, so
 *    nothing here imports N15 `private-session-notice`. Training and retention
 *    belong to N14 `data-controls`.
 *
 * Composition: A9 `entity-row` for the memory row, A12 `section-header` for the
 * two groups, vendored Card, Switch, Textarea, Label, Button, Badge and
 * AlertDialog. The row's detail line sits beside the A9 row rather than inside
 * its description, because A9 truncates its description to one line.
 *
 * Surface: no muted, accent or secondary fill sits behind muted text. Destructive
 * actions are outline buttons or a solid `bg-destructive`, never a tinted one.
 */

type MemoryKind = "preference" | "fact";
type MemoryScope = "global" | { workspace: string };

interface MemoryItem {
  id: string;
  /** What the assistant remembers, in the words the person would read back. */
  text: string;
  kind: MemoryKind;
  /** ISO date or date-time. Shown as a calendar date in UTC so the text is the same everywhere. */
  addedAt: string;
  /** Where it came from, e.g. "Chat: Trip planning" or "Added by you". */
  source?: string;
  scope: MemoryScope;
}

interface MemoryManagerProps extends Omit<React.ComponentProps<"div">, "title"> {
  memories: MemoryItem[];
  /** Whether the assistant saves and uses memories. Controlled. Default true. */
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  /** One sentence for the switch while on. Default states what is remembered and used. */
  onStatement?: string;
  /** One sentence for the switch while off: what stops. Default names what stops and what stays. */
  offStatement?: string;
  /** Called with the trimmed text when the person saves an edit. */
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
  /** Called once, only after the person confirms in the dialog. */
  onReset?: () => void;
  /** The workspace in use. Rows scoped to another workspace say they are not used here. */
  activeWorkspace?: string;
  /** The row to mark "Just added" after a capture. Pair it with a `MemorySavedChip` in the conversation. */
  justSavedId?: string;
  /** Open this row's editor on first render. */
  defaultEditingId?: string;
  /** Open the reset confirmation on first render. */
  defaultResetOpen?: boolean;
  title?: string;
  description?: string;
  /** Heading level of the card title. Default 3, matching M1's section titles. */
  headingLevel?: 2 | 3 | 4;
}

const DEFAULT_ON_STATEMENT =
  "Memory is on: the assistant saves what you ask it to remember and uses it in replies.";
const DEFAULT_OFF_STATEMENT =
  "Memory is off: nothing new is saved and saved memories are not used in replies, but they are kept until you delete them.";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

function formatAdded(addedAt: string) {
  const date = new Date(addedAt);
  return Number.isNaN(date.getTime()) ? addedAt : DATE_FORMAT.format(date);
}

function scopeLabel(scope: MemoryScope) {
  return scope === "global" ? "All workspaces" : `Workspace: ${scope.workspace}`;
}

function appliesHere(scope: MemoryScope, activeWorkspace: string | undefined) {
  if (activeWorkspace === undefined || scope === "global") return true;
  return scope.workspace === activeWorkspace;
}

interface MemoryEditorProps {
  memory: MemoryItem;
  onCancel: () => void;
  onSave: (id: string, text: string) => void;
}

/** Mounts only while a row is being edited, so the draft starts from the saved text and the field takes focus once. */
function MemoryEditor({ memory, onCancel, onSave }: MemoryEditorProps) {
  const fieldId = React.useId();
  const [draft, setDraft] = React.useState(memory.text);
  const fieldRef = React.useRef<HTMLTextAreaElement>(null);
  const trimmed = draft.trim();

  React.useEffect(() => {
    fieldRef.current?.focus();
  }, []);

  return (
    <form
      data-slot="memory-manager-editor"
      className="flex flex-col gap-2 px-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed) onSave(memory.id, trimmed);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <Label htmlFor={fieldId}>Edit memory</Label>
      <Textarea
        id={fieldId}
        ref={fieldRef}
        data-slot="memory-manager-field"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={2}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" data-slot="memory-manager-save" disabled={!trimmed}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-slot="memory-manager-cancel"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface MemoryRowProps {
  memory: MemoryItem;
  activeWorkspace?: string;
  justSaved: boolean;
  editing: boolean;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  editRef: (node: HTMLButtonElement | null) => void;
}

function MemoryRow({
  memory,
  activeWorkspace,
  justSaved,
  editing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  editRef,
}: MemoryRowProps) {
  const uid = React.useId();
  const textId = `${uid}-text`;
  const editId = `${uid}-edit`;
  const deleteId = `${uid}-delete`;

  if (editing) {
    return (
      <li data-slot="memory-manager-item" data-kind={memory.kind} data-editing="" className="py-2">
        <MemoryEditor memory={memory} onCancel={onCancelEdit} onSave={onSave} />
      </li>
    );
  }

  const applies = appliesHere(memory.scope, activeWorkspace);

  return (
    <li
      data-slot="memory-manager-item"
      data-kind={memory.kind}
      data-just-saved={justSaved ? "" : undefined}
      className="flex flex-col gap-1 py-2"
    >
      <EntityRow
        className="items-start"
        title={
          <span id={textId} data-slot="memory-manager-text" className="block whitespace-normal">
            {memory.text}
          </span>
        }
        trailing={
          <span className="flex items-center gap-1">
            {justSaved ? (
              <Badge data-slot="memory-manager-new" variant="outline">
                Just added
              </Badge>
            ) : null}
            <Button
              id={editId}
              ref={editRef}
              type="button"
              size="xs"
              variant="outline"
              data-slot="memory-manager-edit"
              aria-labelledby={`${editId} ${textId}`}
              onClick={() => onStartEdit(memory.id)}
            >
              Edit
            </Button>
            <Button
              id={deleteId}
              type="button"
              size="xs"
              variant="outline"
              data-slot="memory-manager-delete"
              aria-labelledby={`${deleteId} ${textId}`}
              onClick={() => onDelete(memory.id)}
            >
              Delete
            </Button>
          </span>
        }
      />
      <p
        data-slot="memory-manager-meta"
        className="text-foreground flex flex-wrap gap-x-2 gap-y-0.5 px-3 text-xs"
      >
        <span data-slot="memory-manager-scope">{scopeLabel(memory.scope)}</span>
        <span aria-hidden>·</span>
        <span>
          Added <time dateTime={memory.addedAt}>{formatAdded(memory.addedAt)}</time>
        </span>
        {memory.source ? (
          <>
            <span aria-hidden>·</span>
            <span data-slot="memory-manager-source">{memory.source}</span>
          </>
        ) : null}
        {!applies ? (
          <>
            <span aria-hidden>·</span>
            <span data-slot="memory-manager-inactive">Not used in {activeWorkspace}</span>
          </>
        ) : null}
      </p>
    </li>
  );
}

function MemoryManager({
  memories,
  enabled = true,
  onEnabledChange,
  onStatement = DEFAULT_ON_STATEMENT,
  offStatement = DEFAULT_OFF_STATEMENT,
  onEdit,
  onDelete,
  onReset,
  activeWorkspace,
  justSavedId,
  defaultEditingId,
  defaultResetOpen = false,
  title = "Memory",
  description,
  headingLevel = 3,
  className,
  ...props
}: MemoryManagerProps) {
  const uid = React.useId();
  const titleId = `${uid}-title`;
  const switchLabelId = `${uid}-switch-label`;
  const statementId = `${uid}-statement`;
  const [editingId, setEditingId] = React.useState<string | null>(defaultEditingId ?? null);
  const [resetOpen, setResetOpen] = React.useState(defaultResetOpen);
  const [announcement, setAnnouncement] = React.useState("");
  const titleRef = React.useRef<HTMLDivElement>(null);
  const editButtons = React.useRef(new Map<string, HTMLButtonElement>());
  const returnFocusTo = React.useRef<string | null>(null);

  // After Save or Cancel the editor unmounts; put focus back on that row's Edit
  // button so a keyboard user is not dropped at the top of the document.
  React.useEffect(() => {
    if (editingId === null && returnFocusTo.current) {
      editButtons.current.get(returnFocusTo.current)?.focus();
      returnFocusTo.current = null;
    }
  }, [editingId]);

  const finishEdit = (id: string) => {
    returnFocusTo.current = id;
    setEditingId(null);
  };

  const preferences = memories.filter((memory) => memory.kind === "preference");
  const facts = memories.filter((memory) => memory.kind === "fact");
  const count = memories.length;

  const renderGroup = (label: string, items: MemoryItem[]) => {
    const headerId = `${uid}-${label.toLowerCase()}`;
    return (
      <section data-slot="memory-manager-group" data-group={label.toLowerCase()} aria-labelledby={headerId}>
        <SectionHeader id={headerId} title={label} count={items.length} size="sm" />
        {items.length === 0 ? (
          <p data-slot="memory-manager-group-empty" className="text-foreground px-3 py-2 text-xs">
            None saved.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {items.map((memory) => (
              <MemoryRow
                key={memory.id}
                memory={memory}
                activeWorkspace={activeWorkspace}
                justSaved={memory.id === justSavedId}
                editing={memory.id === editingId}
                onStartEdit={setEditingId}
                onCancelEdit={() => finishEdit(memory.id)}
                onSave={(id, text) => {
                  onEdit?.(id, text);
                  setAnnouncement("Memory saved.");
                  finishEdit(id);
                }}
                onDelete={(id) => {
                  titleRef.current?.focus();
                  onDelete?.(id);
                  setAnnouncement("Memory deleted.");
                }}
                editRef={(node) => {
                  if (node) editButtons.current.set(memory.id, node);
                  else editButtons.current.delete(memory.id);
                }}
              />
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <Card
      data-slot="memory-manager"
      data-enabled={enabled ? "true" : "false"}
      role="group"
      aria-labelledby={titleId}
      className={cn("w-full max-w-xl", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          role="heading"
          aria-level={headingLevel}
          data-slot="memory-manager-title"
        >
          {title}
        </CardTitle>
        {description ? (
          <CardDescription data-slot="memory-manager-description">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div data-slot="memory-manager-switch-row" className="flex flex-col gap-1">
          <EntityRow
            className="items-start"
            icon={<BrainCircuit aria-hidden className="size-4" />}
            title={
              <span id={switchLabelId} className="block whitespace-normal">
                Memory
              </span>
            }
            description={
              <span
                id={statementId}
                data-slot="memory-manager-statement"
                className="text-foreground block whitespace-normal"
              >
                {enabled ? onStatement : offStatement}
              </span>
            }
            trailing={
              <Switch
                data-slot="memory-manager-switch"
                aria-labelledby={switchLabelId}
                aria-describedby={statementId}
                checked={enabled}
                onCheckedChange={(next) => onEnabledChange?.(next)}
              />
            }
          />
          <p data-slot="memory-manager-private-note" className="text-foreground px-3 text-xs">
            Private sessions never save memories, whether this is on or off.
          </p>
          {activeWorkspace ? (
            <p data-slot="memory-manager-active" className="text-foreground px-3 text-xs">
              Active memory set: {activeWorkspace}. Memories for all workspaces are used here too.
            </p>
          ) : null}
        </div>

        {count === 0 ? (
          <p data-slot="memory-manager-empty" className="text-foreground px-3 text-sm">
            Nothing remembered yet. A memory appears here when you ask the assistant to remember something,
            and you can edit or delete it at any time.
          </p>
        ) : (
          <div data-slot="memory-manager-groups" className="flex flex-col gap-3">
            {renderGroup("Preferences", preferences)}
            {renderGroup("Facts", facts)}
          </div>
        )}

        {count > 0 ? (
          <div data-slot="memory-manager-reset-row" className="flex px-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-slot="memory-manager-reset"
              onClick={() => setResetOpen(true)}
            >
              Reset all memories
            </Button>
          </div>
        ) : null}

        <p role="status" data-slot="memory-manager-status" className="sr-only">
          {announcement}
        </p>
      </CardContent>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent data-slot="memory-manager-reset-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all memories?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all {count} saved {count === 1 ? "memory" : "memories"}, in every workspace, and it
              cannot be undone. Your account and your chats are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep memories</AlertDialogCancel>
            <AlertDialogAction
              data-slot="memory-manager-reset-confirm"
              className="bg-destructive text-background hover:bg-destructive/90"
              onClick={() => {
                onReset?.();
                setAnnouncement("All memories deleted.");
                setResetOpen(false);
                // The Reset button unmounts with the list; land on the title instead of the document.
                titleRef.current?.focus();
              }}
            >
              Delete all memories
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

interface MemorySavedChipProps extends React.ComponentProps<"div"> {
  /** Called by the review action. The host opens the manager, or scrolls to the row. */
  onReview?: () => void;
  /** Default "Memory updated". */
  label?: string;
  /** Default "Review". The accessible name is this plus the label. */
  reviewLabel?: string;
}

/**
 * The capture moment: a small chip the host renders in the conversation after
 * the assistant saves a memory. It is a polite status, so the update is announced
 * without moving focus.
 */
function MemorySavedChip({
  onReview,
  label = "Memory updated",
  reviewLabel = "Review",
  className,
  ...props
}: MemorySavedChipProps) {
  const labelId = React.useId();
  const reviewId = React.useId();
  return (
    <div
      data-slot="memory-saved-chip"
      role="status"
      className={cn(
        "bg-background text-foreground inline-flex items-center gap-2 rounded-full border py-0.5 ps-3 pe-1 text-xs",
        className,
      )}
      {...props}
    >
      <Check aria-hidden className="size-3 shrink-0" />
      <span id={labelId} data-slot="memory-saved-chip-label">
        {label}
      </span>
      {onReview ? (
        <Button
          id={reviewId}
          type="button"
          size="xs"
          variant="outline"
          data-slot="memory-saved-chip-review"
          aria-labelledby={`${reviewId} ${labelId}`}
          onClick={onReview}
        >
          {reviewLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { MemoryManager, MemorySavedChip };
export type { MemoryItem, MemoryKind, MemoryManagerProps, MemorySavedChipProps, MemoryScope };
