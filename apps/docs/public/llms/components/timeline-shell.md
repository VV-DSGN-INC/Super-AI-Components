# Timeline Shell

> The page shell for a timeline-dominant editor: a tool rail on the left, a content panel beside it, a preview stage with the render queue underneath, transport controls, and a dock along the bottom that is a time ruler with a stack of tracks. It is a variant of the studio shell rather than a second editor — same rail, panel, stage and inspector skeleton, with the page strip swapped for a timeline. It is a block, so it owns arrangement and nothing else: eight shipped components fill the six regions, and each keeps its own props, its own state model and its own accessibility contract.

Layer: block · Family: O · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/timeline-shell.json` · Contract: `components/super-ai/timeline-shell.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/timeline-shell

## Why it matters

CapCut, Descript and Topaz are three very different products that arrange themselves the same way once time is the primary axis, which is what makes this an archetype rather than one app's layout. Two decisions are the ones worth copying. The first is that the timeline and the transcript are the same shell: they are two views of one edit-decision list, so switching between them is a flag, not a second product — Descript's whole premise is that editing the words edits the film, and that only holds if both views read the same playhead. The second is that export is staged rather than instant. A cheap preview render precedes the expensive full export, both stages sit in one visible queue, and every row carries the spec it will be billed for. An editor that hides the difference between a 720p proof and a 4K master teaches people to find out from the invoice.

## When to reach for it

Reach for it when time is the primary axis of the thing being edited — video, audio, motion, anything with a playhead. The shell owns the clock and nothing else: `duration`, `currentTime`, `onSeek`, `zoom`, `snap` and the in/out range are shell props because the transport, the ruler, every lane and the transcript all have to read the same numbers, and passing them separately is how a clip stops sitting under its own timecode. Everything else is forwarded whole — `panel` to the tool panel, `inspector` to the property inspector, `transport` to the transport controls, `transcript` to the transcript editor. Flip `variant` to "transcript" to swap the track stack for the transcript view; both are views of the same edit-decision list, so the playhead and the seek callback stay exactly where they were. Put export jobs in `renderJobs` with their real spec and stage — a preview row and an export row in the same queue is the point. Pass `status` for a message about the whole surface (offline, reconnecting, a failed save, an expired session, a rate limit): it renders at the top of the preview column, only when given, and holds M6 or the vendored Alert. Pass `loading` for first paint: every region draws a skeleton at its loaded size, the root is marked busy, and nothing is mounted that could take focus.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Give the ruler and every lane one scale, and inset the ruler by the lane gutter so second zero lines up.
- Let each lane keep its own gutter controls — mute, solo and lock belong to the track, not to the shell.
- Mount the command palette once, at the root of your app, and keep it out of the shell: it is not a shell slot, and a palette mounted in each shell binds its shortcut once per surface.

## Don't

- Don't let the ruler run at its own zoom or start at its own left edge; every clip then sits under the wrong timecode.
- Don't hand-roll a lane because you only need one. You lose the gutter, the lock, the trim handles and the clip's accessible name in one go.

## Anatomy

- `data-region="rail"`: B4 modality-rail. Selects which tool panel is shown; it never changes the stage.
- `data-region="content-panel"`: I1 tool-panel — media, effects, presets, with its own search and docked prompt.
- `data-region="preview"`: The stage (a caller-supplied player, or L1) with F6 render-queue mounted beneath it.
- `data-region="transport"`: H1 transport-controls, reading the shell's clock — currentTime, duration, in/out.
- `data-region="tracks-ruler"`: H2 time-ruler over a stack of H3 track-lanes — or H4 transcript-editor instead, under variant="transcript".
- `data-region="inspector"`: I2 property-inspector. Selection-driven, and it ships its own nothing-selected state.
- `timeline-shell`: Root. Carries data-variant so a theme can key on which dock is showing.
- `timeline-shell-stage`: The player surface itself — a slot, not a component.
- `timeline-shell-render-queue`: The labelled, focusable section F6 sits in.
- `timeline-shell-tracks`: The ruler + lanes dock, with the full-height playhead layered over it.
- `timeline-shell-transcript`: What the dock renders instead when variant is transcript.
- `timeline-shell-status`: At the top of the preview column, only when `status` is passed. Holds M6 or the vendored Alert; the shell adds no live region of its own.
- `shell-skeleton-region`: One per region while `loading`: hidden from assistive tech and sized like the loaded region. It carries `data-loading-region`, as does each loaded region's box, which is what the loading twin measures.

## Accessibility

**Keyboard**

- Four of the shell's own elements are tab stops in their own right, because each is the element that actually scrolls: the render-queue `<section>`, the tracks group, the transcript group and the inspector. They are pure scroll stops — no key does anything on them — and each one comes before the controls inside it.
- Below `md` the content panel and below `lg` the inspector are Tailwind `hidden`, which is `display: none`, so they leave the tab order entirely rather than becoming invisible stops. At 375px the reachable shell is the rail, the stage and the dock.
- The shell adds no shortcuts. Space does not play, J/K/L do nothing, and no key moves between regions. The transport's own shortcuts (Space, arrows, `,`/`.`, I/O) are bound to the transport's root, so they fire only while focus is inside `data-region="transport"` — never from the stage or the dock.
- Tabbing the tracks dock goes: the tracks group, then the ruler's playhead and in/out handles, then each lane in turn — three gutter toggles, one scroller stop and one stop per clip. Six lanes of ten clips is roughly eighty stops inside a single scroll region with no way to skip a lane.
- `variant` is a prop, not a control. There is no in-shell switch between the track stack and the transcript, so whatever keyboard path reaches that switch is yours to build above the shell.
- While `loading`, the shell mounts none of its controls, so there is no tab stop inside it until the data arrives; a control you pass in `status` is the only one.

**Screen reader**

- The six `data-region` markers are attributes, not landmarks. The shell itself contributes exactly one — the render-queue `<section>`, named by its own `<h2>` — because the stage, the tracks, the transcript and the inspector are all `role="group"` with an `aria-label`, deliberately keeping a six-region editor out of the landmark map.
- The lanes undo that. Each `track-lane` names its clip scroller `role="region"`, so a six-lane edit adds six landmarks inside the one group the shell was trying to keep quiet, and the role is hardcoded in H3 rather than passed in. Nothing in the shell can suppress it.
- The stage is `role="group"` named by `previewLabel` but carries no `tabIndex`, so it is reachable in a screen reader's browse mode and not by Tab.
- Every region name is an English default — `previewLabel`, `renderQueueLabel`, `tracksLabel`, `transcriptLabel`, `inspectorLabel`. Nothing reads a locale, so a localized product passes all five.
- The full-height playhead the shell layers over the dock sits inside an `aria-hidden` wrapper and is given no `label`, so it never double-announces against the one the ruler draws inside its own box. The gutter spacer that aligns second zero is `aria-hidden` too.
- Changing `variant` is announced as nothing. The dock swaps wholesale with no live region anywhere in the shell, so say it where the switch lives.
- The shell owns no status region at all. Play state, seek position, clip selection and export progress announce only as far as the composed components announce them — the transport's own `role="status"`, the render queue's rows — and there is no shell-level summary tying them together.
- While `loading`, the root carries `aria-busy` and every skeleton is hidden from assistive tech, so a screen reader finds one visually hidden line, Loading, plus anything you pass in `status`.
- The shell puts no live region around `status`, and the wrapper mounts together with its content, so a message given on `status`'s first render is not reliably announced on arrival: a live region announces changes to a region already in the DOM, not its own insertion. M6's countdown updates that follow are announced, and the vendored Alert's default assertive alert is generally announced on mount, so choose the one whose announcement fits, or keep `status` mounted and change its content for a later message. Inside a busy root, a screen reader may hold an announcement until `loading` clears.

**Focus**

- Flipping `variant` unmounts the region focus was in. Focus falls to `<body>` and Tab restarts from the top of the page; move it to the other dock as part of the switch.
- Crossing the `md` or `lg` breakpoint does the same to the content panel and the inspector — `display: none` on a focused element drops focus to `<body>`. A window resize or a device rotation is enough to trigger it.
- Selection and focus are not connected. Selecting a clip updates the inspector through `selectedClipId` and moves nothing, so a keyboard user who selects a clip must Tab past every remaining lane to reach its properties, and the inspector never hands focus back.
- All four scroll containers ship `focus-visible:ring-2 ring-ring`, so the four otherwise-invisible stops are visible when a keyboard reaches them.

## Pitfalls

- H3 owns a horizontal scroller per lane and exposes no way to read or set its scroll position, so a stack of lanes cannot be kept in sync with each other or with the ruler. At a zoom where the timeline is wider than the dock, the ruler is clipped rather than scrolled and each lane scrolls on its own. Keep zoom × duration inside the dock width until H3 grows a shared scroll context.
- H3's gutter width is a private constant (`w-40`), so the shell hardcodes the same 10rem + 1px to align the ruler with it. If H3 ever changes that width the ruler drifts silently — nothing fails, the numbers just stop meaning anything. The offset is a named constant here for exactly that reason.
- The shell renders a second playhead. H2's ruler always draws its own inside its box, and the spec's "the playhead spans every track" needs one layered over the whole dock — so both exist, at the same position and the same zoom. Give the spanning one a `label` and you will get two announcements.
- There is no topbar. The studio shell gained one in the 2026-08-08 wireframe reconciliation and this shell's region list was not changed with it, so a document title, breadcrumb or save state has nowhere to live. Put it above the shell until the manifest declares a topbar region here too.
- The content panel and the inspector are hidden below the `md` and `lg` breakpoints. They stay mounted, so the regions are still there, but their content is unreachable on a phone — a timeline editor at 375px shows the rail, the stage and the dock and nothing else. Decide deliberately whether your product needs a narrow-viewport route to the inspector.
- F6 is a six-column table and the queue sits under the stage rather than in the inspector, because a 20rem column cannot show a spec, a stage, a status and a cost side by side. That is a placement decision the spec does not make for you: if your export flow belongs in a dialog, pass no `renderJobs` and the region keeps its own empty affordance.
- Everything is controlled. `currentTime` that never moves, a `selectedClipId` that never changes and a transcript whose `onEdit` goes nowhere produce a screenshot, not an editor — wire the callbacks before demoing it.
- The rail skeleton is B4's width, 92px, written into this shell as `w-23` rather than read from B4. If B4 changes width, this skeleton falls out of step with it, and that class is the one to change.
- The transport skeleton is fixed blocks the size of H1's own controls, so it wraps to a second row at the same widths the controls do. The tracks skeleton always fills the list's `max-h-64` cap, so a project with one short track shrinks the tracks area when it loads.

## Composition

- States: none (a block is a layout, not a state machine)
- Regions: `rail`, `content-panel`, `preview`, `inspector`, `transport`, `tracks-ruler`
- Composes from this registry: modality-rail, tool-panel, transport-controls, time-ruler, track-lane, transcript-editor, property-inspector, render-queue, empty-state, shell-skeleton
- shadcn primitives: none
- npm: lucide-react

## Evidence

CapCut, Descript, Topaz
