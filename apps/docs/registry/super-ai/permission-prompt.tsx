"use client";

import { ChevronDown } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Permission Prompt — Agent asks before a side effect
 *
 * Spec: docs/design-system/component-specs.md#n8-permission-prompt
 * Base: AlertDialog · Verbs: Allow once · Always allow · Deny · Edit first
 *
 * Restored per gaps.md as the single most important missing component in the
 * catalog: every tool-calling agent needs a gate before a consequential call,
 * and this is that gate. Three rules from the spec are load-bearing and
 * pinned by tests:
 *
 * 1. **Edit-first carries equal visual weight with Allow once.** Deny throws
 *    the agent's work away and restarts the loop; edit-first keeps it and
 *    puts the human in the loop productively — a gate versus a collaboration.
 *    Both render as the same Button variant/size, as direct siblings of the
 *    same actions row, never one solid and the other a ghost or menu item.
 * 2. **Arguments are hidden, not summarized, until explicitly expanded** —
 *    the same rule F7 `approval-card` uses for `detail`. Approving what you
 *    cannot read is exactly what this component exists to prevent, so the
 *    raw values are absent from the DOM (not just visually clipped) before
 *    the toggle is pressed.
 * 3. **Always allow only emits the choice.** Choosing it writes a standing
 *    grant, but the grant's review-and-revoke surface belongs to N9
 *    `autonomy-selector`, which already ships. This component never renders
 *    a grant list or a revoke control — a surface that can create a
 *    permanent permission but cannot show you the ones you already granted
 *    is a one-way door.
 *
 * Deny is modeled as the dialog's own Close path (AlertDialogCancel): it is
 * the safest verb to press because pressing it does nothing but end the
 * surface and report the refusal — nothing routes around it.
 *
 * Edit-first does not reopen a second dialog. It swaps the arguments block
 * for an inline editor (one field per argument) and swaps the four verbs for
 * Back / Approve edited, so the human edits the paused call in place rather
 * than starting over.
 */

interface PermissionPromptArgument {
  key: string;
  /** Rendered as plain text and as the value of an editable field under Edit first. */
  value: string;
}

interface PermissionPromptProps extends Omit<React.ComponentProps<"div">, "title" | "onSelect"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Rendered via AlertDialogTrigger's `render=`. Omit and drive `open` yourself. */
  trigger?: React.ReactElement;
  /** The action in plain language — what the agent wants to do. Rendered as the dialog title. */
  action: React.ReactNode;
  /** Why the agent believes this step is needed. */
  reason?: React.ReactNode;
  /** The full arguments the call will run with. Hidden behind an explicit expand — see rule 2 above. */
  args?: PermissionPromptArgument[];
  /** Optionally controlled — omit both and the toggle owns its own state, collapsed by default. */
  argsExpanded?: boolean;
  defaultArgsExpanded?: boolean;
  onArgsExpandedChange?: (expanded: boolean) => void;
  /**
   * Whether Edit first's inline editor is showing in place of the four
   * verbs. Optionally controlled, same shape as `argsExpanded` — omit both
   * and Edit first owns its own state, closed by default. Exposed mainly so
   * a paused-call flow can resume directly into editing.
   */
  editing?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  allowOnceLabel?: string;
  alwaysAllowLabel?: string;
  denyLabel?: string;
  editFirstLabel?: string;
  /** Terminal. Approves this one call; nothing persists past it. */
  onAllowOnce?: () => void;
  /** Writes a standing grant. See rule 3 above — this only emits the choice. */
  onAlwaysAllow?: () => void;
  /** Terminal, and the dialog's own Close path — see the safety note above. */
  onDeny?: () => void;
  /** Fires with the edited arguments once the human approves the edited version. */
  onEditFirst?: (args: Record<string, string>) => void;
}

function PermissionPrompt({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  action,
  reason,
  args = [],
  argsExpanded,
  defaultArgsExpanded = false,
  onArgsExpandedChange,
  editing,
  defaultEditing = false,
  onEditingChange,
  allowOnceLabel = "Allow once",
  alwaysAllowLabel = "Always allow",
  denyLabel = "Deny",
  editFirstLabel = "Edit first",
  onAllowOnce,
  onAlwaysAllow,
  onDeny,
  onEditFirst,
  className,
  ...props
}: PermissionPromptProps) {
  const argsListId = React.useId();
  const [uncontrolledArgsExpanded, setUncontrolledArgsExpanded] = React.useState(defaultArgsExpanded);
  const isArgsExpanded = argsExpanded ?? uncontrolledArgsExpanded;

  const [uncontrolledEditing, setUncontrolledEditing] = React.useState(defaultEditing);
  const isEditing = editing ?? uncontrolledEditing;
  const [editedValues, setEditedValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(args.map((arg) => [arg.key, arg.value])),
  );

  const toggleArgsExpanded = () => {
    const next = !isArgsExpanded;
    if (argsExpanded === undefined) setUncontrolledArgsExpanded(next);
    onArgsExpandedChange?.(next);
  };

  const setEditingState = (next: boolean) => {
    if (editing === undefined) setUncontrolledEditing(next);
    onEditingChange?.(next);
  };

  const handleApproveEdited = () => onEditFirst?.(editedValues);

  return (
    <AlertDialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger render={trigger} /> : null}
      {/* Overriding a vendored ui/ primitive's data-slot is house idiom — see
          trust-dialog.tsx for the same move. */}
      <AlertDialogContent
        data-slot="permission-prompt"
        className={cn("gap-4 sm:max-w-md", className)}
        {...props}
      >
        <AlertDialogHeader data-slot="permission-prompt-header">
          <AlertDialogTitle>{action}</AlertDialogTitle>
          {reason ? <AlertDialogDescription>{reason}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        {/* Rule 2: arguments render only behind the explicit toggle, never as
            a summary line — the value text simply is not in the DOM until
            expanded, the same way approval-card's `detail` behaves. */}
        {!isEditing && args.length > 0 ? (
          <div data-slot="permission-prompt-arguments" className="flex flex-col items-start gap-2">
            <Button
              data-slot="permission-prompt-arguments-expand"
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={isArgsExpanded}
              aria-controls={argsListId}
              onClick={toggleArgsExpanded}
            >
              <ChevronDown
                aria-hidden
                className={cn("transition-transform", isArgsExpanded && "rotate-180")}
              />
              {isArgsExpanded
                ? "Hide arguments"
                : `Show ${args.length === 1 ? "argument" : `all ${args.length} arguments`}`}
            </Button>
            {isArgsExpanded ? (
              <dl
                id={argsListId}
                data-slot="permission-prompt-arguments-list"
                className="border-border bg-card w-full rounded-lg border p-2.5 text-xs"
              >
                {args.map((arg) => (
                  <div key={arg.key} className="grid grid-cols-[6rem_1fr] gap-2 py-0.5">
                    <dt className="text-muted-foreground truncate font-mono">{arg.key}</dt>
                    <dd className="text-foreground font-mono break-all">{arg.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : null}

        {/* Edit-first swaps the arguments block for an inline editor rather
            than opening a second dialog — the human edits the paused call in
            place, they don't start a fresh review. */}
        {isEditing ? (
          <div data-slot="permission-prompt-editor" className="flex flex-col gap-3">
            {args.map((arg) => {
              const fieldId = `${argsListId}-${arg.key}`;
              return (
                <div key={arg.key} className="flex flex-col gap-1">
                  <Label htmlFor={fieldId} className="text-muted-foreground font-mono text-xs font-normal">
                    {arg.key}
                  </Label>
                  <Textarea
                    id={fieldId}
                    data-slot="permission-prompt-editor-field"
                    value={editedValues[arg.key] ?? ""}
                    onChange={(event) => {
                      const next = event.target.value;
                      setEditedValues((prev) => ({ ...prev, [arg.key]: next }));
                    }}
                    className="font-mono text-xs"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        <AlertDialogFooter data-slot="permission-prompt-actions">
          {isEditing ? (
            <>
              <Button
                data-slot="permission-prompt-back"
                type="button"
                variant="outline"
                onClick={() => setEditingState(false)}
              >
                Back
              </Button>
              <Button
                data-slot="permission-prompt-approve-edited"
                type="button"
                variant="default"
                onClick={handleApproveEdited}
              >
                Approve edited
              </Button>
            </>
          ) : (
            <>
              <AlertDialogCancel data-slot="permission-prompt-deny" onClick={onDeny}>
                {denyLabel}
              </AlertDialogCancel>
              <Button
                data-slot="permission-prompt-always-allow"
                type="button"
                variant="outline"
                onClick={onAlwaysAllow}
              >
                {alwaysAllowLabel}
              </Button>
              {/* Rule 1: identical variant/size to Allow once below, and a
                  plain sibling Button in this same footer — never a menu
                  item, a link, or a smaller/quieter treatment. */}
              <Button
                data-slot="permission-prompt-edit-first"
                type="button"
                variant="default"
                onClick={() => setEditingState(true)}
              >
                {editFirstLabel}
              </Button>
              <AlertDialogAction
                data-slot="permission-prompt-allow-once"
                variant="default"
                onClick={onAllowOnce}
              >
                {allowOnceLabel}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { PermissionPrompt };
export type { PermissionPromptArgument, PermissionPromptProps };
