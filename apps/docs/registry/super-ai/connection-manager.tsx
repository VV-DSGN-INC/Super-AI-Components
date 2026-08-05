"use client";

import { CheckCircle2, CloudOff, Download, HardDrive, KeyRound, Loader2, TriangleAlert } from "lucide-react";
import * as React from "react";

import { EntityRow } from "./entity-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Connection Manager — BYO keys and local models
 *
 * Spec: docs/design-system/component-specs.md (M7)
 * States: not-set · valid · invalid · unreachable · local-model
 *
 * Two decisions run through the whole file:
 *
 * 1. `invalid` and `unreachable` are different failures with opposite
 *    remedies. A rejected key is the user's to fix; a provider that is down is
 *    not, and telling someone to regenerate a working key wastes their time and
 *    rotates a credential for nothing. They therefore never share copy, never
 *    share a remedy, and never share an action set — `unreachable` deliberately
 *    offers no "Replace key" button at all.
 * 2. Keys are write-only. There is no `keyValue` prop and no way to read one
 *    back: the input is uncontrolled, is cleared the moment it is handed to
 *    `onSaveKey`, and what renders afterwards is a caller-supplied
 *    `fingerprint`. A settings page that can render a secret back is an
 *    exfiltration surface, so the API simply does not have the shape.
 */

type ConnectionStatus = "not-set" | "valid" | "invalid" | "unreachable";

interface HardwareRequirement {
  /** What is required, e.g. "Memory". */
  label: string;
  /** How much of it, e.g. "16 GB RAM". */
  value: string;
  /**
   * Whether this machine meets it. `false` blocks the download — a model that
   * downloads and then cannot run is worse than one that was never offered.
   * Leave undefined when the host cannot detect the capability.
   */
  met?: boolean;
}

interface LocalModel {
  /** Download size, stated before the download rather than during it. */
  size?: string;
  /** Hardware requirements. Rendered above the download button, always. */
  requirements: HardwareRequirement[];
}

interface ConnectionProvider {
  id: string;
  /** Provider or model name, e.g. "OpenAI" or "Llama 3.1 8B". */
  name: string;
  status: ConnectionStatus;
  /**
   * Masked fingerprint of the stored key, e.g. "sk-live ···· 4f2a". Never the
   * key. The component never receives the key it saved, so it cannot leak it.
   */
  fingerprint?: string;
  /** When the connection was last tested, e.g. "Tested 4 minutes ago". */
  testedAt?: string;
  /** A test is in flight. Its result is the row's next `status`. */
  testing?: boolean;
  /** Present on a local model row; absent on a hosted, keyed provider. */
  local?: LocalModel;
}

interface ConnectionManagerProps extends React.ComponentProps<"div"> {
  label?: string;
  description?: string;
  providers: ConnectionProvider[];
  /**
   * Receives the key exactly once. Saving stores a credential and nothing
   * else — it is not a test, and the component reports no verdict from it.
   */
  onSaveKey?: (providerId: string, key: string) => void;
  /**
   * Test-connection is a first-class action with its own result, because it is
   * the only way anyone learns whether a failure is `invalid` or `unreachable`.
   */
  onTest?: (providerId: string) => void;
  onDownload?: (providerId: string) => void;
}

interface Condition {
  /** The row's state in words. Never a bare colour or dot. */
  label: string;
  /** What to do about it — different per failure, by design. */
  remedy: string;
}

/**
 * A key that has been saved but never tested is not `valid`, and pretending it
 * is would be the same lie as collapsing the two failures. It sits under
 * `not-set` — the credential store has something, the connection has no verdict —
 * and it is the state the row lands in the instant `onSaveKey` returns.
 */
const SAVED_UNTESTED: Condition = {
  label: "Saved, but never tested. Nothing has checked this key yet.",
  remedy: "Test the connection to find out whether it works. Saving stored the key without checking it.",
};

const HOSTED_CONDITIONS: Record<ConnectionStatus, Condition> = {
  "not-set": {
    label: "Not connected. No key is saved for this provider.",
    remedy:
      "Paste a key to connect it. The key is stored write-only — afterwards you will see a fingerprint, never the key itself.",
  },
  valid: {
    label: "Connected. The provider accepted this key.",
    remedy: "Test it again after rotating the key, or if requests start failing.",
  },
  invalid: {
    label: "Key rejected. The provider answered, and refused this key.",
    remedy:
      "Generate a new key and replace this one. The provider itself is healthy, so retrying the same key will fail the same way.",
  },
  unreachable: {
    label: "Provider unreachable. The request got no answer at all.",
    remedy:
      "Keep the saved key — it was not rejected, and replacing it will not help. Check the provider's status page and test again shortly.",
  },
};

const LOCAL_CONDITIONS: Record<ConnectionStatus, Condition> = {
  "not-set": {
    label: "Not installed. This model has not been downloaded yet.",
    remedy: "Check the requirements below first. A model that downloads and then cannot run helps nobody.",
  },
  valid: {
    label: "Installed and running locally. No key required.",
    remedy: "Prompts and outputs stay on this machine.",
  },
  invalid: {
    label: "Model files rejected. The download failed its integrity check.",
    remedy: "Delete the files and download again. The local runtime itself is fine.",
  },
  unreachable: {
    label: "Local runtime not responding. The model files are intact.",
    remedy: "Start the runtime, then test again. Nothing needs re-downloading.",
  },
};

const STATUS_ICONS: Record<ConnectionStatus, React.ElementType> = {
  "not-set": KeyRound,
  valid: CheckCircle2,
  invalid: TriangleAlert,
  unreachable: CloudOff,
};

/**
 * A9's description slot truncates to one line, which is right for a menu row and
 * wrong for a saved-key line that may carry a fingerprint and a test time. The
 * call-site arbitrary variant is the same technique `model-picker` uses to reach
 * inside A9 when a plain `className` cannot.
 */
const ENTITY_ROW_WRAP = "[&_[data-slot=entity-row-description]]:whitespace-normal";

function ConnectionManager({
  label = "Connections",
  description,
  providers,
  onSaveKey,
  onTest,
  onDownload,
  className,
  ...props
}: ConnectionManagerProps) {
  // Which row has its key field open. Never holds a key — only an id.
  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <Card data-slot="connection-manager" className={cn("w-full max-w-xl", className)} {...props}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {providers.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              editing={editingId === provider.id}
              onEdit={() => setEditingId(provider.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveKey={onSaveKey}
              onTest={onTest}
              onDownload={onDownload}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface ProviderRowProps {
  provider: ConnectionProvider;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveKey?: (providerId: string, key: string) => void;
  onTest?: (providerId: string) => void;
  onDownload?: (providerId: string) => void;
}

function ProviderRow({
  provider,
  editing,
  onEdit,
  onCancelEdit,
  onSaveKey,
  onTest,
  onDownload,
}: ProviderRowProps) {
  const { id, name, status, fingerprint, testedAt, testing, local } = provider;
  const isLocal = local !== undefined;
  const untested = !isLocal && status === "not-set" && fingerprint !== undefined;
  const condition = untested ? SAVED_UNTESTED : (isLocal ? LOCAL_CONDITIONS : HOSTED_CONDITIONS)[status];
  const StatusIcon = isLocal && status === "not-set" ? HardDrive : STATUS_ICONS[status];

  const fieldId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [draftLength, setDraftLength] = React.useState(0);

  const unmet = local?.requirements.filter((requirement) => requirement.met === false) ?? [];
  const downloadBlocked = unmet.length > 0;

  // A key field is offered when nothing is stored, or when the user explicitly
  // asked to replace what is stored. It is never offered for `unreachable`:
  // there the saved key is not the problem.
  const showKeyField = !isLocal && ((status === "not-set" && !untested) || editing);
  const canReplace = !isLocal && (status === "valid" || status === "invalid" || untested);
  // Nothing to test until something is stored — and after saving, the test is a
  // separate deliberate press rather than something save quietly did for you.
  const canTest = (status !== "not-set" || untested) && typeof onTest === "function";

  const handleSave = () => {
    const input = inputRef.current;
    if (!input) return;
    const key = input.value;
    if (key.length === 0) return;
    onSaveKey?.(id, key);
    // Cleared immediately: the component holds the secret for the length of one
    // call and never puts it anywhere the DOM can be read from again.
    input.value = "";
    setDraftLength(0);
    onCancelEdit();
  };

  const secondary: React.ReactNode[] = [];
  if (fingerprint) secondary.push(fingerprint);
  if (isLocal && local?.size) secondary.push(`${local.size} download`);
  if (testedAt) secondary.push(testedAt);

  return (
    <li
      data-slot="connection-manager-provider"
      data-provider-id={id}
      data-status={status}
      data-kind={isLocal ? "local-model" : "hosted"}
      className={cn(
        "flex flex-col gap-2 rounded-lg border py-1",
        // `invalid` is the only state that asks the user to act on the
        // credential, so it is the only one drawn as such. `unreachable` stays
        // neutral on purpose — the two failures must not look interchangeable.
        status === "invalid" && "border-destructive/40",
      )}
    >
      <EntityRow
        className={ENTITY_ROW_WRAP}
        icon={<StatusIcon className="size-4" aria-hidden />}
        title={name}
        description={secondary.length > 0 ? secondary.join(" · ") : undefined}
      />

      {/* The result of a test lands here, announced. Condition and remedy are
          always both present: a state with no stated next step is a dead end. */}
      <div data-slot="connection-manager-result" role="status" className="flex flex-col gap-1 px-3 text-sm">
        <p data-slot="connection-manager-condition" className="font-medium">
          {testing ? "Testing this connection…" : condition.label}
        </p>
        <p data-slot="connection-manager-remedy" className="text-muted-foreground text-xs">
          {testing
            ? "The result will say whether the key was rejected or the provider is down."
            : condition.remedy}
        </p>
      </div>

      {/* Requirements sit above the download button, in DOM and reading order.
          Stating them after the download is the failure this prevents. */}
      {isLocal && local.requirements.length > 0 ? (
        <div data-slot="connection-manager-requirements" className="px-3 text-xs">
          <p className="font-medium">Requires</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {local.requirements.map((requirement) => (
              <li
                key={requirement.label}
                data-slot="connection-manager-requirement"
                data-met={requirement.met === undefined ? undefined : String(requirement.met)}
                className="text-muted-foreground"
              >
                {requirement.label}: {requirement.value}
                {requirement.met === false ? " — this machine does not meet it" : null}
                {requirement.met === true ? " — met" : null}
              </li>
            ))}
          </ul>
          {downloadBlocked ? (
            <p data-slot="connection-manager-blocked" className="mt-1 font-medium">
              Download blocked: this machine cannot run the model.
            </p>
          ) : null}
        </div>
      ) : null}

      {showKeyField ? (
        <div data-slot="connection-manager-key-field" className="flex flex-col gap-1.5 px-3">
          {/* A real, visible label — never a placeholder and never a tooltip.
              `type=password` plus autoComplete off keeps the value out of
              browser stores; there is no reveal toggle by design. */}
          <Label htmlFor={fieldId}>{name} API key</Label>
          <div className="flex items-center gap-2">
            <Input
              id={fieldId}
              ref={inputRef}
              type="password"
              autoComplete="off"
              spellCheck={false}
              data-slot="connection-manager-key-input"
              onChange={(event) => setDraftLength(event.target.value.length)}
            />
            <Button type="button" onClick={handleSave} disabled={draftLength === 0}>
              Save key
            </Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={onCancelEdit}>
                Cancel
              </Button>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            Saving stores the key. It does not check it — test the connection afterwards.
          </p>
        </div>
      ) : null}

      <div data-slot="connection-manager-actions" className="flex flex-wrap items-center gap-2 px-3 pb-2">
        {canTest ? (
          <Button
            type="button"
            variant={status === "invalid" ? "outline" : "default"}
            onClick={() => onTest?.(id)}
            disabled={testing}
          >
            {testing ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {testing ? "Testing…" : "Test connection"}
          </Button>
        ) : null}
        {canReplace && !editing ? (
          <Button type="button" variant={status === "invalid" ? "default" : "outline"} onClick={onEdit}>
            Replace key
          </Button>
        ) : null}
        {isLocal && status === "not-set" && onDownload ? (
          <Button type="button" onClick={() => onDownload(id)} disabled={downloadBlocked}>
            <Download aria-hidden />
            Download model
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export { ConnectionManager };
export type { ConnectionManagerProps, ConnectionProvider, ConnectionStatus, HardwareRequirement, LocalModel };
