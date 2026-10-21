"use client";

import { PenLine } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Voice Profile — Saved rules for how output sounds, with the active voice shown at the input.
 *
 * Spec: docs/design-system/component-specs.md, section E11 voice-profile
 * States: none · preset · custom · editing · scoped · conflict · reset
 *
 * There is no variant axis. The seven states are what the data and the host say:
 * `activeId` empty or set, the active voice's `source`, `defaultEditingId`, a
 * project `scope`, a `conflict` prop, and the one-step reset.
 *
 * Decisions from the spec that tests pin:
 *
 * 1. **The entry point is at the input.** `ActiveVoiceChip` is its own export with
 *    its own data-slot. It states the voice name, source and scope in text, for a
 *    composer to host. The profile never renders it.
 * 2. **A custom voice is rules, not a mood.** Tone, words to use, words to avoid,
 *    formatting and an example, edited in a labelled form. Team and preset voices
 *    show the same rules read-only. `onPreview(rules)` shows a sample under the
 *    current rules, including unsaved edits.
 * 3. **Scope is visible, and switching it is one action.** Every voice states
 *    "All projects" or "Project: X" in text. The scope Select changes it in one
 *    step and calls `onScopeChange`.
 * 4. **Conflicts are shown, never resolved silently.** `conflict` names the voice
 *    that wins, the one it wins over, and the reason, all as a sentence.
 * 5. **Reset to neutral is one step.** No dialog. `onReset` fires once per press,
 *    saved voices are kept, and a sentence says so.
 *
 * L3 components never import each other, so nothing here imports E4 `preset-grid`
 * (saved visual styles), N17 `memory-manager` (what the AI knows about the person)
 * or E3 `parameter-panel` (generation parameters).
 *
 * Composition: A9 `entity-row` for each voice, A12 `section-header` for the list,
 * vendored Card, Select, Input, Textarea, Label, Badge and Button. The row's
 * detail line sits beside the A9 row rather than inside its description, because
 * A9 truncates its description to one line.
 *
 * Surface: no muted, accent or secondary fill sits behind muted text.
 */

type VoiceSource = "personal" | "team" | "system";
type VoiceScope = "global" | { project: string };

interface VoiceRules {
  /** One line, e.g. "Plain and direct". */
  tone?: string;
  /** Words and phrases to prefer. */
  use?: string[];
  /** Words and phrases to avoid. */
  avoid?: string[];
  /** e.g. "Short paragraphs, no bullet lists." */
  formatting?: string;
  /** A sentence written in the voice. */
  example?: string;
}

interface Voice {
  id: string;
  name: string;
  /** Who owns the voice. Only a `personal` voice can be edited or re-scoped here. */
  source: VoiceSource;
  scope: VoiceScope;
  rules: VoiceRules;
}

/** Two voices could apply at once; the host says which wins and why. */
interface VoiceConflict {
  winnerId: string;
  otherId: string;
  /** One sentence, e.g. "A project voice is more specific than a global one." */
  reason: string;
}

interface VoiceProfileProps extends Omit<React.ComponentProps<"div">, "title"> {
  voices: Voice[];
  /** The voice in use. Controlled. `null` or absent means neutral: no rules applied. */
  activeId?: string | null;
  onActiveChange?: (id: string) => void;
  /** Called with the whole voice when the person saves an edit. */
  onSave?: (voice: Voice) => void;
  /** Called when the person changes a voice's scope, in one action. */
  onScopeChange?: (id: string, scope: VoiceScope) => void;
  /** Called once per press of Reset to neutral. Saved voices are not deleted. */
  onReset?: () => void;
  /** Returns a sample of output written under these rules. */
  onPreview?: (rules: VoiceRules) => Promise<string>;
  conflict?: VoiceConflict;
  /** The project in use. Voices held to another project say they are not used here. */
  activeProject?: string;
  /** Open this voice's editor on first render. Only a personal voice can open. */
  defaultEditingId?: string;
  title?: string;
  description?: string;
  /** Heading level of the card title. Default 3, matching M1's section titles. */
  headingLevel?: 2 | 3 | 4;
}

const SOURCE_LABEL: Record<VoiceSource, string> = {
  personal: "Personal",
  team: "Team",
  system: "Preset",
};

function scopeLabel(scope: VoiceScope) {
  return scope === "global" ? "All projects" : `Project: ${scope.project}`;
}

function appliesHere(scope: VoiceScope, activeProject: string | undefined) {
  if (activeProject === undefined || scope === "global") return true;
  return scope.project === activeProject;
}

function splitList(text: string) {
  return text
    .split(/[,\n]/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function cleanRules(rules: VoiceRules): VoiceRules {
  const out: VoiceRules = {};
  if (rules.tone?.trim()) out.tone = rules.tone.trim();
  if (rules.use?.length) out.use = rules.use;
  if (rules.avoid?.length) out.avoid = rules.avoid;
  if (rules.formatting?.trim()) out.formatting = rules.formatting.trim();
  if (rules.example?.trim()) out.example = rules.example.trim();
  return out;
}

interface VoicePreviewProps {
  rules: VoiceRules;
  onPreview: (rules: VoiceRules) => Promise<string>;
}

type PreviewState =
  | { status: "idle" }
  | { status: "loading"; rules: string }
  | { status: "done"; rules: string; text: string }
  | { status: "error"; rules: string };

/** The sample is a polite live region that stays mounted, so a result is announced when it arrives. */
function VoicePreview({ rules, onPreview }: VoicePreviewProps) {
  const [result, setResult] = React.useState<PreviewState>({ status: "idle" });
  const run = React.useRef(0);
  const signature = JSON.stringify(rules);

  // A sample belongs to the rules it was written under; changing them shows nothing until asked again.
  const state: PreviewState =
    result.status !== "idle" && result.rules !== signature ? { status: "idle" } : result;

  const start = () => {
    const mine = ++run.current;
    setResult({ status: "loading", rules: signature });
    onPreview(rules).then(
      (text) => {
        if (run.current === mine) setResult({ status: "done", rules: signature, text });
      },
      () => {
        if (run.current === mine) setResult({ status: "error", rules: signature });
      },
    );
  };

  return (
    <div data-slot="voice-profile-preview" className="flex flex-col gap-2">
      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-slot="voice-profile-preview-button"
          disabled={state.status === "loading"}
          onClick={start}
        >
          Preview a sample
        </Button>
      </div>
      <div role="status" data-slot="voice-profile-preview-output" className="text-foreground text-sm">
        {state.status === "loading" ? <p>Writing a sample under these rules</p> : null}
        {state.status === "error" ? <p>The sample could not be written. Try again.</p> : null}
        {state.status === "done" ? (
          <figure className="flex flex-col gap-1">
            <figcaption className="text-xs font-medium">Sample under these rules</figcaption>
            <blockquote
              data-slot="voice-profile-preview-text"
              className="border-s-2 ps-3 whitespace-pre-wrap"
            >
              {state.text}
            </blockquote>
          </figure>
        ) : null}
      </div>
    </div>
  );
}

interface VoiceEditorProps {
  voice: Voice;
  onCancel: () => void;
  onSave: (voice: Voice) => void;
  onPreview?: (rules: VoiceRules) => Promise<string>;
}

/** Mounts only while a voice is being edited, so the draft starts from the saved voice and the first field takes focus once. */
function VoiceEditor({ voice, onCancel, onSave, onPreview }: VoiceEditorProps) {
  const uid = React.useId();
  const [name, setName] = React.useState(voice.name);
  const [tone, setTone] = React.useState(voice.rules.tone ?? "");
  const [use, setUse] = React.useState((voice.rules.use ?? []).join(", "));
  const [avoid, setAvoid] = React.useState((voice.rules.avoid ?? []).join(", "));
  const [formatting, setFormatting] = React.useState(voice.rules.formatting ?? "");
  const [example, setExample] = React.useState(voice.rules.example ?? "");
  const nameRef = React.useRef<HTMLInputElement>(null);
  const trimmedName = name.trim();

  React.useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const draft = cleanRules({ tone, use: splitList(use), avoid: splitList(avoid), formatting, example });

  return (
    <form
      data-slot="voice-profile-editor"
      className="flex flex-col gap-3 px-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmedName) onSave({ ...voice, name: trimmedName, rules: draft });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-name`}>Voice name</Label>
        <Input
          id={`${uid}-name`}
          ref={nameRef}
          data-slot="voice-profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-tone`}>Tone</Label>
        <Input
          id={`${uid}-tone`}
          data-slot="voice-profile-tone"
          value={tone}
          onChange={(event) => setTone(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-use`}>Words to use</Label>
        <Input
          id={`${uid}-use`}
          data-slot="voice-profile-use"
          aria-describedby={`${uid}-list-hint`}
          value={use}
          onChange={(event) => setUse(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-avoid`}>Words to avoid</Label>
        <Input
          id={`${uid}-avoid`}
          data-slot="voice-profile-avoid"
          aria-describedby={`${uid}-list-hint`}
          value={avoid}
          onChange={(event) => setAvoid(event.target.value)}
        />
        <p id={`${uid}-list-hint`} className="text-foreground text-xs">
          Separate words and phrases with commas.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-formatting`}>Formatting</Label>
        <Input
          id={`${uid}-formatting`}
          data-slot="voice-profile-formatting"
          value={formatting}
          onChange={(event) => setFormatting(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-example`}>Example</Label>
        <Textarea
          id={`${uid}-example`}
          data-slot="voice-profile-example"
          rows={3}
          value={example}
          onChange={(event) => setExample(event.target.value)}
        />
      </div>
      {onPreview ? <VoicePreview rules={draft} onPreview={onPreview} /> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" data-slot="voice-profile-save" disabled={!trimmedName}>
          Save voice
        </Button>
        <Button type="button" size="sm" variant="outline" data-slot="voice-profile-cancel" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RuleList({ label, words, slot }: { label: string; words: string[]; slot: string }) {
  return (
    <div data-slot={slot} className="flex flex-col gap-1">
      <dt className="text-xs font-medium">{label}</dt>
      <dd>
        <ul className="flex flex-wrap gap-1">
          {words.map((word) => (
            <li key={word}>
              <Badge variant="outline">{word}</Badge>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
}

function RuleText({ label, text, slot }: { label: string; text: string; slot: string }) {
  return (
    <div data-slot={slot} className="flex flex-col gap-1">
      <dt className="text-xs font-medium">{label}</dt>
      <dd className="text-sm">{text}</dd>
    </div>
  );
}

/** The rules of one voice as read-only text. An empty rule is omitted rather than shown blank. */
function VoiceRulesView({ rules }: { rules: VoiceRules }) {
  const empty =
    !rules.tone && !rules.use?.length && !rules.avoid?.length && !rules.formatting && !rules.example;
  if (empty) {
    return (
      <p data-slot="voice-profile-no-rules" className="text-foreground text-sm">
        This voice has no rules yet.
      </p>
    );
  }
  return (
    <dl data-slot="voice-profile-rules" className="flex flex-col gap-2">
      {rules.tone ? <RuleText label="Tone" text={rules.tone} slot="voice-profile-rule-tone" /> : null}
      {rules.use?.length ? (
        <RuleList label="Words to use" words={rules.use} slot="voice-profile-rule-use" />
      ) : null}
      {rules.avoid?.length ? (
        <RuleList label="Words to avoid" words={rules.avoid} slot="voice-profile-rule-avoid" />
      ) : null}
      {rules.formatting ? (
        <RuleText label="Formatting" text={rules.formatting} slot="voice-profile-rule-formatting" />
      ) : null}
      {rules.example ? (
        <RuleText label="Example" text={rules.example} slot="voice-profile-rule-example" />
      ) : null}
    </dl>
  );
}

interface ScopeSelectProps {
  voice: Voice;
  project: string;
  onChange: (scope: VoiceScope) => void;
}

function ScopeSelect({ voice, project, onChange }: ScopeSelectProps) {
  const uid = React.useId();
  const labelId = `${uid}-label`;
  const valueId = `${uid}-value`;
  const value = voice.scope === "global" ? "global" : "project";
  const labels = { global: "All projects", project: `Only ${project}` };
  return (
    <div data-slot="voice-profile-scope" className="flex items-center gap-2">
      <span id={labelId} className="text-sm">
        Applies to
      </span>
      <Select value={value} onValueChange={(next) => onChange(next === "global" ? "global" : { project })}>
        <SelectTrigger
          data-slot="voice-profile-scope-trigger"
          size="sm"
          aria-labelledby={`${labelId} ${valueId}`}
          className="min-w-36"
        >
          <SelectValue id={valueId}>{labels[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent
          aria-labelledby={labelId}
          className="motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
        >
          <SelectItem value="global">{labels.global}</SelectItem>
          <SelectItem value="project">{labels.project}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function VoiceProfile({
  voices,
  activeId,
  onActiveChange,
  onSave,
  onScopeChange,
  onReset,
  onPreview,
  conflict,
  activeProject,
  defaultEditingId,
  title = "Voice",
  description,
  headingLevel = 3,
  className,
  ...props
}: VoiceProfileProps) {
  const uid = React.useId();
  const titleId = `${uid}-title`;
  const listId = `${uid}-list`;
  const active = voices.find((voice) => voice.id === activeId) ?? null;
  const [editingId, setEditingId] = React.useState<string | null>(defaultEditingId ?? null);
  const [justReset, setJustReset] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");
  const currentRef = React.useRef<HTMLSpanElement>(null);
  const editButton = React.useRef<HTMLButtonElement>(null);
  const returnFocusToEdit = React.useRef(false);

  const editing = active && active.source === "personal" && active.id === editingId ? active : null;
  const nameOf = (id: string) => voices.find((voice) => voice.id === id)?.name ?? id;

  // After Save or Cancel the editor unmounts; put focus back on Edit so a
  // keyboard user is not dropped at the top of the document.
  React.useEffect(() => {
    if (!editing && returnFocusToEdit.current) {
      editButton.current?.focus();
      returnFocusToEdit.current = false;
    }
  }, [editing]);

  const finishEdit = () => {
    returnFocusToEdit.current = true;
    setEditingId(null);
  };

  // The Use and Reset buttons unmount when the voice changes; focus moves to the
  // current-voice line, which is always mounted, before that happens.
  const switchTo = (voice: Voice) => {
    currentRef.current?.focus();
    setJustReset(false);
    setEditingId(null);
    onActiveChange?.(voice.id);
    setAnnouncement(`Voice set to ${voice.name}.`);
  };

  const reset = () => {
    currentRef.current?.focus();
    setEditingId(null);
    setJustReset(true);
    onReset?.();
    setAnnouncement("Voice reset to neutral.");
  };

  const projectFor = (voice: Voice) => (voice.scope === "global" ? activeProject : voice.scope.project);

  const projectName = active ? projectFor(active) : undefined;
  const readOnlyWhy =
    active && active.source !== "personal"
      ? active.source === "team"
        ? "This is a team voice. Its rules are read-only here."
        : "This is a preset voice. Its rules are read-only here."
      : null;

  return (
    <Card
      data-slot="voice-profile"
      data-source={active?.source ?? "neutral"}
      role="group"
      aria-labelledby={titleId}
      className={cn("w-full max-w-xl", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle id={titleId} role="heading" aria-level={headingLevel} data-slot="voice-profile-title">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription data-slot="voice-profile-description">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section
          data-slot="voice-profile-current-block"
          aria-label="Current voice"
          className="flex flex-col gap-2"
        >
          <EntityRow
            className="items-start"
            icon={<PenLine aria-hidden className="size-4" />}
            title={
              <span
                ref={currentRef}
                tabIndex={-1}
                data-slot="voice-profile-current"
                className="block whitespace-normal outline-none focus-visible:underline"
              >
                {active ? active.name : "Neutral"}
              </span>
            }
            trailing={
              active ? (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  data-slot="voice-profile-reset"
                  onClick={reset}
                >
                  Reset to neutral
                </Button>
              ) : null
            }
          />
          <p data-slot="voice-profile-current-meta" className="text-foreground px-3 text-xs">
            {active ? (
              <>
                {SOURCE_LABEL[active.source]} voice · {scopeLabel(active.scope)}
                {!appliesHere(active.scope, activeProject) ? ` · Not used in ${activeProject}` : ""}
              </>
            ) : justReset ? (
              <span data-slot="voice-profile-reset-note">
                Reset to neutral. No voice rules are applied, and your saved voices are kept.
              </span>
            ) : (
              "No voice rules are applied. Replies use the assistant's default tone."
            )}
          </p>
        </section>

        {conflict ? (
          <div
            data-slot="voice-profile-conflict"
            data-winner={conflict.winnerId}
            className="flex flex-col gap-1 rounded-lg border px-3 py-2"
          >
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <Badge variant="outline">Conflict</Badge>
              <span data-slot="voice-profile-conflict-winner">
                {nameOf(conflict.winnerId)} wins over {nameOf(conflict.otherId)}.
              </span>
            </p>
            <p data-slot="voice-profile-conflict-reason" className="text-foreground text-xs">
              {conflict.reason}
            </p>
          </div>
        ) : null}

        {active && !editing ? (
          <section
            data-slot="voice-profile-detail"
            aria-label={`${active.name} rules`}
            className="flex flex-col gap-3 px-3"
          >
            <VoiceRulesView rules={active.rules} />
            {readOnlyWhy ? (
              <p data-slot="voice-profile-read-only" className="text-foreground text-xs">
                {readOnlyWhy}
              </p>
            ) : null}
            {active.source === "personal" && projectName ? (
              <ScopeSelect
                voice={active}
                project={projectName}
                onChange={(scope) => {
                  onScopeChange?.(active.id, scope);
                  setAnnouncement(
                    `${active.name} now applies to ${scopeLabel(scope).replace("Project: ", "")}.`,
                  );
                }}
              />
            ) : null}
            {onPreview ? <VoicePreview rules={active.rules} onPreview={onPreview} /> : null}
            {active.source === "personal" ? (
              <div>
                <Button
                  ref={editButton}
                  type="button"
                  size="sm"
                  variant="outline"
                  data-slot="voice-profile-edit"
                  onClick={() => setEditingId(active.id)}
                >
                  Edit rules
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        {editing ? (
          <VoiceEditor
            key={editing.id}
            voice={editing}
            onPreview={onPreview}
            onCancel={finishEdit}
            onSave={(next) => {
              onSave?.(next);
              setAnnouncement("Voice saved.");
              finishEdit();
            }}
          />
        ) : null}

        <section data-slot="voice-profile-list" aria-labelledby={listId}>
          <SectionHeader id={listId} title="Voices" count={voices.length} size="sm" />
          {voices.length === 0 ? (
            <p data-slot="voice-profile-empty" className="text-foreground px-3 py-2 text-sm">
              No saved voices yet. A voice you save appears here, and you can switch to it at any time.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {voices.map((voice) => {
                const isActive = voice.id === active?.id;
                const rowId = `${uid}-${voice.id}`;
                return (
                  <li
                    key={voice.id}
                    data-slot="voice-profile-item"
                    data-source={voice.source}
                    data-active={isActive ? "" : undefined}
                    className="flex flex-col gap-1 py-2"
                  >
                    <EntityRow
                      className="items-start"
                      title={
                        <span
                          id={`${rowId}-name`}
                          data-slot="voice-profile-item-name"
                          className="block whitespace-normal"
                        >
                          {voice.name}
                        </span>
                      }
                      trailing={
                        isActive ? (
                          <Badge data-slot="voice-profile-item-active" variant="outline">
                            Active
                          </Badge>
                        ) : (
                          <Button
                            id={`${rowId}-use`}
                            type="button"
                            size="xs"
                            variant="outline"
                            data-slot="voice-profile-use-voice"
                            aria-labelledby={`${rowId}-use ${rowId}-name`}
                            onClick={() => switchTo(voice)}
                          >
                            Use
                          </Button>
                        )
                      }
                    />
                    <p
                      data-slot="voice-profile-item-meta"
                      className="text-foreground flex flex-wrap gap-x-2 gap-y-0.5 px-3 text-xs"
                    >
                      <span data-slot="voice-profile-item-source">{SOURCE_LABEL[voice.source]}</span>
                      <span aria-hidden>·</span>
                      <span data-slot="voice-profile-item-scope">{scopeLabel(voice.scope)}</span>
                      {!appliesHere(voice.scope, activeProject) ? (
                        <>
                          <span aria-hidden>·</span>
                          <span data-slot="voice-profile-item-inactive">Not used in {activeProject}</span>
                        </>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p role="status" data-slot="voice-profile-status" className="sr-only">
          {announcement}
        </p>
      </CardContent>
    </Card>
  );
}

interface ActiveVoiceChipProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The voice in use, or null/absent for neutral. */
  voice?: Pick<Voice, "name" | "source" | "scope"> | null;
  /** When set the chip is a button that opens the profile; otherwise it is plain text. */
  onOpen?: () => void;
}

/**
 * The entry point at the input: the active voice's name, source and scope as
 * text, small enough to sit beside a composer. The host places it; the profile
 * never renders it.
 */
function ActiveVoiceChip({ voice, onOpen, className, ...props }: ActiveVoiceChipProps) {
  const surface =
    "bg-background text-foreground inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs";
  const content = (
    <>
      <PenLine aria-hidden className="size-3 shrink-0" />
      <span data-slot="active-voice-chip-name" className="min-w-0 truncate font-medium">
        {voice ? `Voice: ${voice.name}` : "Voice: Neutral"}
      </span>
      {voice ? (
        <>
          <span aria-hidden>·</span>
          <span data-slot="active-voice-chip-source" className="shrink-0">
            {SOURCE_LABEL[voice.source]}
          </span>
          <span aria-hidden>·</span>
          <span data-slot="active-voice-chip-scope" className="shrink-0">
            {scopeLabel(voice.scope)}
          </span>
        </>
      ) : null}
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        data-slot="active-voice-chip"
        data-voice={voice ? "set" : "neutral"}
        onClick={onOpen}
        className={cn(
          surface,
          "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none",
          className,
        )}
        {...(props as React.ComponentProps<"button">)}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      data-slot="active-voice-chip"
      data-voice={voice ? "set" : "neutral"}
      className={cn(surface, className)}
      {...props}
    >
      {content}
    </span>
  );
}

export { ActiveVoiceChip, VoiceProfile };
export type {
  ActiveVoiceChipProps,
  Voice,
  VoiceConflict,
  VoiceProfileProps,
  VoiceRules,
  VoiceScope,
  VoiceSource,
};
