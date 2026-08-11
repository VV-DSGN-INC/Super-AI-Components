"use client";

import { AlertTriangle } from "lucide-react";
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
import {
  Alert as WarningAlert,
  AlertDescription as WarningAlertDescription,
  AlertTitle as WarningAlertTitle,
} from "@/components/ui/alert";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Trust Dialog — Confirm running third-party content
 *
 * Spec: docs/design-system/component-specs.md#n2-trust-dialog
 * States: preview · warning · trust-checkbox · account-picker
 *
 * Base: AlertDialog (a modal decision, not a dismissible Dialog — closing on
 * an outside click would defeat a safety gate) and Checkbox, following the
 * consent-capture shape voice-clone-recorder already established: an
 * AlertDialogAction that starts `disabled` and only clears once a checkbox
 * is ticked. Four rules from the spec are load-bearing and pinned by tests:
 *
 * 1. **Continue stays disabled until the checkbox is ticked.** This is the
 *    component's whole reason to exist — the one surface between a user and
 *    someone else's prompt or code. `trusted` is optionally controlled
 *    (value ?? own state, the approval-card/settings-dialog convention), but
 *    the disabled wiring always runs off the resolved boolean.
 * 2. **The preview renders above the warning, unconditionally** — never the
 *    reverse, never collapsed behind a toggle. Reading what will run has to
 *    happen before the warning asks for a decision about it, so both are
 *    fixed, always-present blocks rather than steps a caller can reorder.
 * 3. **The account picker lives inside the Continue control**, not as a
 *    second dialog step or a field of its own above the footer. `accounts`
 *    (when passed, however many) render as a Select attached to Continue via
 *    ButtonGroup — a destination choice riding on the same affordance as the
 *    decision to proceed, never a separate screen. Omitting `accounts`
 *    renders Continue alone.
 * 4. **The warning is `role="note"`, not the vendored Alert's default
 *    `role="alert"`.** The dialog itself already grabs focus and gets
 *    announced on open (Base UI's AlertDialog.Popup is `role="alertdialog"`
 *    with `aria-labelledby` wired to Title) — a nested assertive region
 *    inside it would double-announce the same moment.
 */

interface TrustDialogAccount {
  id: string;
  name: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

interface TrustDialogProps extends Omit<React.ComponentProps<"div">, "title" | "onSelect"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Rendered via AlertDialogTrigger's `render=`. Omit and drive `open` yourself. */
  trigger?: React.ReactElement;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** What will run. Always rendered above the warning — see rule 2 above. */
  preview: React.ReactNode;
  previewLabel?: string;
  /** Overrides the default third-party-content copy; keep it specific to what's actually running. */
  warning?: React.ReactNode;
  warningTitle?: string;
  trustLabel?: string;
  /** Optionally controlled — omit both and the checkbox owns its own state, unchecked by default. */
  trusted?: boolean;
  defaultTrusted?: boolean;
  onTrustedChange?: (trusted: boolean) => void;
  /** Rendered as a Select attached to Continue when non-empty. See rule 3 above. */
  accounts?: TrustDialogAccount[];
  selectedAccountId?: string;
  onAccountChange?: (id: string) => void;
  accountLabel?: string;
  continueLabel?: string;
  cancelLabel?: string;
  /** The only signal that it's safe to proceed. Fires with the chosen account id, when accounts are offered. */
  onContinue?: (accountId?: string) => void;
  onCancel?: () => void;
}

function TrustDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title = "Review before running",
  description,
  preview,
  previewLabel = "What will run",
  warning,
  warningTitle = "This is third-party content",
  trustLabel = "I've reviewed this and trust the source",
  trusted,
  defaultTrusted = false,
  onTrustedChange,
  accounts,
  selectedAccountId,
  onAccountChange,
  accountLabel = "Run in",
  continueLabel = "Continue",
  cancelLabel = "Cancel",
  onContinue,
  onCancel,
  className,
  ...props
}: TrustDialogProps) {
  const checkboxId = React.useId();
  const [uncontrolledTrusted, setUncontrolledTrusted] = React.useState(defaultTrusted);
  const isTrusted = trusted ?? uncontrolledTrusted;

  const showAccountPicker = Boolean(accounts && accounts.length > 0);
  const currentAccount = accounts?.find((account) => account.id === selectedAccountId) ?? accounts?.[0];

  const handleTrustedChange = (next: boolean) => {
    if (trusted === undefined) setUncontrolledTrusted(next);
    onTrustedChange?.(next);
  };

  return (
    <AlertDialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger render={trigger} /> : null}
      {/* Overriding a vendored ui/ primitive's data-slot is house idiom — see
          settings-dialog.tsx and voice-clone-recorder.tsx for the same move. */}
      <AlertDialogContent data-slot="trust-dialog" className={cn("gap-4 sm:max-w-md", className)} {...props}>
        <AlertDialogHeader data-slot="trust-dialog-header">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        <div data-slot="trust-dialog-body" className="flex flex-col gap-3">
          {/* Rule 2: preview always precedes the warning in DOM order — this
              is a fixed layout decision, not something a caller can flip. */}
          <div data-slot="trust-dialog-preview" className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">{previewLabel}</span>
            <div
              data-slot="trust-dialog-preview-content"
              className="border-border bg-card text-foreground max-h-40 overflow-auto rounded-lg border p-2.5 text-sm"
            >
              {preview}
            </div>
          </div>

          {/* role="note": see rule 4 above — the AlertDialog itself already
              owns the assertive announcement on open. */}
          <WarningAlert
            role="note"
            data-slot="trust-dialog-warning"
            className="border-warning/40 bg-warning/5"
          >
            <AlertTriangle className="text-warning size-4" />
            <WarningAlertTitle>{warningTitle}</WarningAlertTitle>
            <WarningAlertDescription className="text-foreground">
              {warning ??
                "This may run code or access data from a source you didn't create. Review the preview above before continuing."}
            </WarningAlertDescription>
          </WarningAlert>

          <label
            htmlFor={checkboxId}
            data-slot="trust-dialog-checkbox-row"
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm"
          >
            <Checkbox
              id={checkboxId}
              data-slot="trust-dialog-checkbox"
              checked={isTrusted}
              onCheckedChange={(checked) => handleTrustedChange(checked === true)}
              className="mt-0.5"
            />
            <span className="text-foreground">{trustLabel}</span>
          </label>
        </div>

        <AlertDialogFooter data-slot="trust-dialog-footer">
          <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
          <ButtonGroup data-slot="trust-dialog-continue-group">
            <AlertDialogAction
              data-slot="trust-dialog-continue"
              disabled={!isTrusted}
              onClick={() =>
                onContinue?.(showAccountPicker ? (selectedAccountId ?? currentAccount?.id) : undefined)
              }
            >
              {continueLabel}
            </AlertDialogAction>
            {/* Rule 3: the picker is part of the Continue affordance, never a
                separate step — it rides on the same ButtonGroup as the action
                it qualifies, not a field above the footer. */}
            {showAccountPicker ? (
              <Select value={currentAccount?.id} onValueChange={(value) => onAccountChange?.(String(value))}>
                <SelectTrigger
                  data-slot="trust-dialog-account-trigger"
                  aria-label={`${accountLabel}: ${currentAccount?.name ?? ""}`}
                >
                  <SelectValue>{currentAccount?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent data-slot="trust-dialog-account-content">
                  {accounts!.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                      data-slot="trust-dialog-account-item"
                      className="p-0"
                    >
                      <EntityRow
                        icon={account.icon}
                        title={account.name}
                        description={account.description}
                        className="min-h-0 w-full py-1.5"
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </ButtonGroup>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { TrustDialog };
export type { TrustDialogAccount, TrustDialogProps };
