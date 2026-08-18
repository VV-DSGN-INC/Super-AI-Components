"use client";

import { LoaderCircle, MessagesSquare } from "lucide-react";
import * as React from "react";

import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/registry/super-ai/app-sidebar";
import { AppTopbar, type AppTopbarProps } from "@/registry/super-ai/app-topbar";
import { ArtifactGrid, type ArtifactGridSession } from "@/registry/super-ai/artifact-grid";
import { ContextChip, ContextChips, type ContextChipKind } from "@/registry/super-ai/context-chips";
import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { Feedback, type FeedbackProps } from "@/registry/super-ai/feedback";
import { MediaPromptBar, type MediaPromptBarProps } from "@/registry/super-ai/media-prompt-bar";
import { ModeTabs, type ModeTabsOption } from "@/registry/super-ai/mode-tabs";
import { PaywallMessage, type PaywallMessageProps } from "@/registry/super-ai/paywall-message";
import { ThreadList, ThreadListItem, ThreadListSection } from "@/registry/super-ai/thread-list";

/**
 * Chat Shell — chat / agent workspace
 *
 * Spec: docs/design-system/block-specs.md#o2-chat-shell
 * Regions: sidebar · topbar · message-stream · artifact-cards · composer
 *
 * The first block in the catalog. It owns arrangement and nothing else: every
 * region is filled by an already-shipped registry component, and every one of
 * them keeps its own props, its own state model and its own accessibility
 * contract. Three sentences from the spec drive the layout:
 *
 * 1. "The sidebar doubles as a job queue: running tasks show spinners in B6,
 *    so background work is visible without leaving the thread." B6 has no
 *    `running` prop, so the running status renders as a labelled sibling of
 *    the row it belongs to rather than a reimplemented thread row — see
 *    `ChatShellThread.running`.
 * 2. "Artifacts render as cards inside the stream and open into their own
 *    surface. The conversation is an index, not a container." The artifact
 *    region is therefore a child of the message stream, and it is always
 *    mounted — on day one it shows J4's own empty line rather than vanishing,
 *    because a region that disappears cannot teach that it exists.
 * 3. "M5 lives in the stream." The paywall is the last turn of the
 *    conversation, not an interstitial over it, which is why it is a
 *    stream-level prop and not a dialog.
 *
 * A fourth sentence governs the stream itself: "Composes AI Elements'
 * conversation and message rather than reimplementing them." Those two are not
 * catalog components — they come from a different vendor's registry
 * (registry.ai-sdk.dev) and are declared on the manifest row's `external`
 * field, so `npx shadcn add chat-shell` resolves them upstream instead of this
 * repo forking them.
 */

/**
 * `contain: layout` makes this element the containing block for its
 * absolutely- and fixed-positioned descendants. The vendored `Sidebar`'s
 * desktop container is `fixed inset-y-0 h-svh`, which is correct when a shell
 * owns the whole viewport and wrong everywhere else — inside a docs preview,
 * a Storybook canvas, or an app region it would escape its parent and pin
 * itself to the browser's left edge. Containment keeps the shell embeddable
 * without patching the primitive.
 */
const EMBEDDABLE_SHELL = "[contain:layout]";

/**
 * The other half of `EMBEDDABLE_SHELL`. Containment redirects where the
 * vendored sidebar's `fixed` box is anchored, but its `h-svh` still takes its
 * height from the viewport — so in any shell shorter than the window the
 * sidebar overhangs and everything it bottom-anchors (`sidebarPromo`,
 * `sidebarFooter`) falls below the visible edge. Clipped, not hidden: those
 * controls stayed in the tab order while being invisible.
 *
 * Targets `[data-slot=app-sidebar]`, not the vendored `sidebar-container`
 * default named at `components/ui/sidebar.tsx:230`: B1 renders
 * `<Sidebar data-slot="app-sidebar" ...>`, and `Sidebar` spreads that prop
 * onto the very div that also carries its own `data-slot="sidebar-container"`
 * — the spread lands after the default, so `app-sidebar` is what's actually
 * on the element at runtime. Verified in the browser (rendered `data-slot`
 * inspected directly): the vendored name never appears once B1 is in use.
 *
 * Overriding here rather than in the primitive: `components/ui` is vendored
 * and stays byte-identical to upstream.
 */
const SIDEBAR_FILLS_SHELL = "[&_[data-slot=app-sidebar]]:h-full";

/**
 * D1 is the media-gen omnibox and offers a negative-prompt field in every
 * presentation except `node-embedded`, which is a different shape entirely.
 * A chat composer has no negative prompt, and D1 exposes no way to turn the
 * affordance off — `negativePrompt={false}` only closes the panel and leaves
 * the toggle. `display: none` removes the control from the tab order and the
 * accessibility tree, so this is a suppression rather than a visual-only hide.
 * Delete this the moment D1 grows a real opt-out.
 */
const COMPOSER_NO_NEGATIVE_PROMPT = "[&_[data-slot=media-prompt-bar-negative-toggle]]:hidden";

/**
 * `use-stick-to-bottom` renders its own scroll element between
 * `ConversationContent`'s root and its children, and sets no overflow on it —
 * and AI Elements passes no `scrollClassName`, so out of the box the element
 * that is supposed to scroll is `overflow: visible` and the conversation
 * simply grows. This is the class that makes the stream scroll at all. It goes
 * through `scrollClassName`, the only handle `ConversationContent` exposes on
 * that element, which is also why the region's tab stop and accessible name
 * have to sit on `Conversation` instead.
 */
const STREAM_SCROLL = "h-full overflow-y-auto";

interface ChatShellThread {
  id: string;
  title: string;
  /**
   * A background job on this thread is still running. The sidebar is the job
   * queue, so this renders as a labelled status line under the row — a
   * spinning glyph on its own would be state conveyed by motion alone.
   */
  running?: boolean;
  /** Overrides the default "Running" wording, e.g. "Rendering 4K export". */
  runningLabel?: string;
  unread?: boolean;
  pinned?: boolean;
}

interface ChatShellThreadGroup {
  id: string;
  /** "Today", "Last 7 days" — B6 groups by recency, not by project. */
  label: string;
  threads: ChatShellThread[];
}

interface ChatShellContextChip {
  id: string;
  kind: ContextChipKind;
  label: string;
  unresolved?: boolean;
  onRemove?: () => void;
}

interface ChatShellMessage {
  id: string;
  role: "user" | "assistant";
  content: React.ReactNode;
  /**
   * N1 feedback for this turn. Fully forwarded and fully controlled — the
   * shell never owns a rating, because the surface that submits it does.
   */
  feedback?: FeedbackProps;
}

interface ChatShellProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** B2 workspace switcher, or anything else that belongs above the thread list. */
  switcher?: React.ReactNode;
  /** B6 threads, grouped by recency. Empty renders L1 in the sidebar. */
  threadGroups?: ChatShellThreadGroup[];
  activeThreadId?: string;
  onSelectThread?: (id: string) => void;
  onRenameThread?: (id: string, title: string) => void;
  onDeleteThread?: (id: string) => void;
  onTogglePinThread?: (id: string) => void;
  /**
   * B5 promo or any ambient sidebar CTA. Collapses away at icon-rail width.
   *
   * **Clipped out of view unless the shell is viewport-tall** — B1 anchors this
   * above its footer, and the containment that keeps the shell embeddable also
   * clips B1's `h-svh` box. See the pitfalls in the docs page.
   */
  sidebarPromo?: React.ReactNode;
  /**
   * B8 account menu, or whatever anchors the bottom of the sidebar.
   *
   * **Clipped out of view unless the shell is viewport-tall** — same
   * bottom-anchoring problem as `sidebarPromo`. See the pitfalls in the docs
   * page.
   */
  sidebarFooter?: React.ReactNode;
  /** Replaces the default L1 shown when there are no threads. */
  threadsEmpty?: React.ReactNode;
  /** Starts the sidebar collapsed — the shell's half of B1's width contract. */
  defaultSidebarOpen?: boolean;

  /** The active conversation's title, shown in B7. */
  title?: string;
  /** The rest of B7 — breadcrumb, privacy chip, saved label, trailing actions. */
  topbar?: Omit<AppTopbarProps, "context" | "title">;

  /** The conversation, oldest first. Empty renders L1 in the stream. */
  messages?: ChatShellMessage[];
  /**
   * J4 sessions. Grouped by session because that is J4's data model and a
   * conversation *is* a session — wiring artifacts per turn would fight the
   * component and split one session's output across several grids.
   */
  artifacts?: ArtifactGridSession[];
  artifactsLabel?: string;
  artifactsEmptyLabel?: string;
  /** M5, rendered as the final turn: the run that did not happen. */
  paywall?: PaywallMessageProps;
  /** Replaces the default L1 shown when there are no turns. */
  empty?: React.ReactNode;

  /** D1, the composer. `presentation`, `contextChips` and `settings` are the shell's. */
  composer?: Omit<MediaPromptBarProps, "presentation" | "contextChips" | "settings">;
  /** D3 references attached to the next message. */
  contextChips?: ChatShellContextChip[];
  /** D4 modes. Two to five; past that D4's spec says reach for a select. */
  modes?: ModeTabsOption[];
  mode?: string;
  onModeChange?: (mode: string) => void;
  /** Replaces N3's default "AI can make mistakes" wording. */
  disclaimer?: React.ReactNode;
}

function ChatShellRunningJob({ label }: { label: string }) {
  return (
    <p
      data-slot="chat-shell-thread-running"
      // A job that starts while you are reading another thread has to announce
      // itself; the visible word carries the same fact for anyone who cannot
      // see the spinner turn.
      role="status"
      className="text-foreground flex items-center gap-1.5 px-2 pb-1 text-xs"
    >
      <LoaderCircle aria-hidden className="size-3 shrink-0 animate-spin" />
      {label}
    </p>
  );
}

/**
 * AI Elements' `Message` + `MessageContent`, not a hand-rolled bubble. `from`
 * drives the `is-user`/`is-assistant` class that carries every alignment and
 * surface decision, so the turn styling lives upstream where it is shared with
 * every other AI Elements surface.
 *
 * `MessageResponse` (the Streamdown markdown renderer) is deliberately not
 * used: `content` here is a `ReactNode`, so the caller decides whether their
 * turns are markdown, and a shell should not force a renderer on them.
 */
function ChatShellTurn({ message }: { message: ChatShellMessage }) {
  return (
    <Message
      from={message.role}
      data-slot="chat-shell-turn"
      data-message-id={message.id}
      data-role={message.role}
    >
      <MessageContent data-slot="chat-shell-turn-body" className="leading-relaxed">
        {message.content}
      </MessageContent>
      {/* N1 is an assistant-turn affordance: there is nothing to rate about
          your own message. Gated here rather than left to the caller. */}
      {message.role === "assistant" && message.feedback ? <Feedback {...message.feedback} /> : null}
    </Message>
  );
}

function ChatShell({
  switcher,
  threadGroups = [],
  activeThreadId,
  onSelectThread,
  onRenameThread,
  onDeleteThread,
  onTogglePinThread,
  sidebarPromo,
  sidebarFooter,
  threadsEmpty,
  defaultSidebarOpen = true,

  title = "New conversation",
  topbar,

  messages = [],
  artifacts = [],
  artifactsLabel = "Artifacts",
  artifactsEmptyLabel = "Nothing yet. Anything this conversation produces collects here.",
  paywall,
  empty,

  composer,
  contextChips = [],
  modes = [],
  mode,
  onModeChange,
  disclaimer,

  className,
  ...props
}: ChatShellProps) {
  const artifactsLabelId = React.useId();
  const hasTurns = messages.length > 0 || Boolean(paywall);

  return (
    <SidebarProvider
      // Overriding a vendored ui/ primitive's slot is house idiom — nothing
      // keys on `sidebar-wrapper`, and the block needs one addressable root.
      data-slot="chat-shell"
      defaultOpen={defaultSidebarOpen}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      {/* display:contents — the region marker has to be addressable without
          inserting a box between the flex row and B1's own gap/container
          pair, which is what positions the sidebar. */}
      <div data-region="sidebar" className="contents">
        <AppSidebar
          switcher={switcher}
          nav={
            <ThreadList aria-label="Conversations" className="px-2">
              {threadGroups.length > 0
                ? threadGroups.map((group) => (
                    <ThreadListSection key={group.id} label={group.label}>
                      {group.threads.map((thread) => (
                        <div key={thread.id} data-thread-id={thread.id}>
                          <ThreadListItem
                            id={thread.id}
                            title={thread.title}
                            active={thread.id === activeThreadId}
                            unread={thread.unread}
                            pinned={thread.pinned}
                            onSelect={onSelectThread}
                            onRename={onRenameThread}
                            onDelete={onDeleteThread}
                            onTogglePin={onTogglePinThread}
                          />
                          {thread.running ? (
                            <ChatShellRunningJob label={thread.runningLabel ?? "Running"} />
                          ) : null}
                        </div>
                      ))}
                    </ThreadListSection>
                  ))
                : (threadsEmpty ?? (
                    <EmptyState
                      size="panel"
                      title="No conversations yet"
                      description="Ask something below and it will be saved here."
                    />
                  ))}
            </ThreadList>
          }
          promo={sidebarPromo}
          footer={sidebarFooter}
        />
      </div>

      <SidebarInset className="min-w-0 overflow-hidden">
        {/* B7 has no leading slot, so the sidebar trigger is a sibling and the
            topbar's own bottom border moves out to this row — otherwise the
            trigger sits above the rule the header draws. */}
        <div
          data-region="topbar"
          className="bg-background flex h-12 shrink-0 items-center gap-1 border-b pl-2"
        >
          <SidebarTrigger />
          <AppTopbar
            context="document"
            title={title}
            {...topbar}
            // cn last, like the composer below: a bare className after the
            // spread would silently swallow a caller's `topbar.className`.
            className={cn("h-11 min-w-0 flex-1 border-b-0 pl-1", topbar?.className)}
          />
        </div>

        {/* AI Elements' Conversation, not a hand-rolled scroll container: it
            brings `role="log"` and use-stick-to-bottom's pinning, which is the
            behaviour a chat stream is actually judged on. It carries the
            region name and the tab stop; `scrollClassName` is what makes the
            inner element it owns actually scroll (see STREAM_SCROLL). */}
        <Conversation
          data-region="message-stream"
          aria-label="Conversation"
          tabIndex={0}
          className="min-h-0 flex-1"
        >
          <ConversationContent
            scrollClassName={STREAM_SCROLL}
            className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6"
          >
            {hasTurns ? (
              <>
                {messages.map((message) => (
                  <ChatShellTurn key={message.id} message={message} />
                ))}
                {/* M5 last: it is the turn that did not happen, so nothing can
                    follow it until the plan changes. */}
                {paywall ? <PaywallMessage {...paywall} /> : null}
              </>
            ) : (
              (empty ?? (
                <EmptyState
                  size="page"
                  title="Start the conversation"
                  description="Describe what you want done. Anything produced along the way is collected below."
                  icon={<MessagesSquare />}
                />
              ))
            )}

            {/* Inside the stream, not beside it: the conversation is the index
                of what it produced. Always mounted so the region is
                discoverable on day one rather than appearing from nowhere. */}
            <section
              data-region="artifact-cards"
              aria-labelledby={artifactsLabelId}
              className="flex w-full flex-col gap-3 border-t pt-6"
            >
              <h2 id={artifactsLabelId} className="text-sm font-medium">
                {artifactsLabel}
              </h2>
              <ArtifactGrid
                sessions={artifacts}
                filterable={false}
                emptyLabel={artifactsEmptyLabel}
              />
            </section>
          </ConversationContent>
        </Conversation>

        <div data-region="composer" className="bg-background shrink-0 border-t px-4 pb-2">
          <div className="mx-auto w-full max-w-3xl">
            <MediaPromptBar
              presentation="docked"
              placeholder="Ask anything, or describe a task to run"
              label="Message"
              submitLabel="Send"
              attachLabel="Attach a file"
              contextChips={
                contextChips.length > 0 ? (
                  <ContextChips>
                    {contextChips.map((chip) => (
                      <ContextChip
                        key={chip.id}
                        kind={chip.kind}
                        label={chip.label}
                        unresolved={chip.unresolved}
                        onRemove={chip.onRemove}
                      />
                    ))}
                  </ContextChips>
                ) : undefined
              }
              settings={
                modes.length > 0 ? (
                  <ModeTabs modes={modes} value={mode} onValueChange={onModeChange} label="Chat mode" />
                ) : undefined
              }
              {...composer}
              className={cn(COMPOSER_NO_NEGATIVE_PROMPT, "border-b", composer?.className)}
            />
            <DisclaimerNote variant="under-composer">{disclaimer}</DisclaimerNote>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { ChatShell };
export type { ChatShellContextChip, ChatShellMessage, ChatShellProps, ChatShellThread, ChatShellThreadGroup };
