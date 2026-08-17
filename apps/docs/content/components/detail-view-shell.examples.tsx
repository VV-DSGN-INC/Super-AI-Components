"use client";

import { useState } from "react";

import { DetailFields, DetailViewShell } from "@/registry/super-ai/detail-view-shell";

/**
 * Live examples for detail-view-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so
 * detail-view-shell.docs.tsx has to stay plain server-evaluable data and
 * cannot carry "use client" itself. The shell is controlled — `open`,
 * `onOpenChange` and `mode` all need handlers — so the examples live here and
 * arrive there as zero-prop elements.
 *
 * Every example uses `mode="fullscreen"`, which is the only mode that renders
 * inline: popup is a real Dialog and overlay is `fixed`, and either of them
 * would take over the documentation page rather than sit in an example box.
 * The body is identical in all three modes, so a fullscreen example is an
 * honest one — that is exactly the property the first Do is about.
 */

const FIELDS = [
  { id: "status", label: "Status", value: "In progress" },
  { id: "owner", label: "Owner", value: "Priya N." },
  { id: "due", label: "Due", value: "4 August 2026" },
  { id: "estimate", label: "Estimate", value: "3 days" },
];

function Header({ title }: { title: string }) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
      <h3 className="truncate text-sm font-medium">{title}</h3>
    </header>
  );
}

function Body() {
  return <DetailFields fields={FIELDS} className="p-4" />;
}

const CONVERSATION = [
  {
    id: "comments",
    label: "Comments",
    count: 3,
    content: (
      <ul className="flex flex-col gap-2 p-4 text-sm">
        <li>Priya: pulled the copy from the brief.</li>
        <li>Sam: the second paragraph still needs a source.</li>
        <li>Priya: added one.</li>
      </ul>
    ),
  },
];

/** Do — the same body, measured. Wide gives two columns; narrow collapses to tabs. */
export function SameBodyBothWidths() {
  return (
    <div className="flex w-full flex-wrap gap-3">
      <div className="h-56 min-w-0 flex-1 basis-[26rem] overflow-hidden rounded-lg border">
        <DetailViewShell
          open
          onOpenChange={() => {}}
          mode="fullscreen"
          ariaLabel="Wide record (example)"
          header={<Header title="Release notes for 2.4" />}
          attributes={<Body />}
          conversation={CONVERSATION}
        />
      </div>
      <div className="h-56 w-[20rem] max-w-full overflow-hidden rounded-lg border">
        <DetailViewShell
          open
          onOpenChange={() => {}}
          mode="fullscreen"
          ariaLabel="Narrow record (example)"
          header={<Header title="Release notes for 2.4" />}
          attributes={<Body />}
          conversation={CONVERSATION}
        />
      </div>
    </div>
  );
}

/** Do — the collection stays mounted; a second click swaps the panel's content. */
export function SwapsContentOnSecondClick() {
  const RECORDS = [
    { id: "r1", title: "Release notes for 2.4", owner: "Priya N." },
    { id: "r2", title: "Icon set audit", owner: "Sam O." },
    { id: "r3", title: "Onboarding email", owner: "Ada K." },
  ];
  const [activeId, setActiveId] = useState("r1");
  const active = RECORDS.find((record) => record.id === activeId) ?? RECORDS[0];

  return (
    <div className="flex w-full flex-wrap gap-3">
      <ul className="flex w-48 shrink-0 flex-col gap-1">
        {RECORDS.map((record) => (
          <li key={record.id}>
            <button
              type="button"
              onClick={() => setActiveId(record.id)}
              aria-current={record.id === activeId ? "true" : undefined}
              className={`focus-visible:ring-ring w-full rounded-md px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:outline-none ${
                record.id === activeId ? "bg-accent text-accent-foreground" : "text-foreground"
              }`}
            >
              {record.title}
            </button>
          </li>
        ))}
      </ul>
      <div className="h-44 min-w-0 flex-1 basis-[20rem] overflow-hidden rounded-lg border">
        <DetailViewShell
          open
          onOpenChange={() => {}}
          mode="fullscreen"
          ariaLabel="Record detail (example)"
          header={<Header title={active.title} />}
          attributes={
            <DetailFields
              fields={[
                { id: "owner", label: "Owner", value: active.owner },
                { id: "status", label: "Status", value: "In progress" },
              ]}
              className="p-4"
            />
          }
        />
      </div>
    </div>
  );
}

/** Don't — a body hand-laid for the wide case, dropped into a narrow panel. */
export function BodyBranchedOnMode() {
  // The wrong way: a fixed two-column grid written for "the popup", which is
  // the same layout problem as a 380px overlay. Nothing measures anything, so
  // the columns crush instead of collapsing.
  return (
    <div className="h-44 w-[20rem] max-w-full overflow-hidden rounded-lg border">
      <DetailViewShell
        open
        onOpenChange={() => {}}
        mode="fullscreen"
        ariaLabel="Hand-laid body (anti-example)"
        header={<Header title="Release notes for 2.4" />}
        attributes={
          <div className="grid grid-cols-[8rem_1fr_8rem_1fr] gap-x-4 gap-y-1.5 p-4 text-sm">
            {FIELDS.map((field) => (
              <div key={field.id} className="contents">
                <span className="text-muted-foreground">{field.label}</span>
                <span className="min-w-0">{field.value}</span>
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}

/** Don't — a mode control inside the shell, with no route behind it. */
export function ModeSwitchWithoutNavigation() {
  // The wrong way: "Open full page" living in the shell's own header. The shell
  // owns no routing, so the control changes the frame in place and the URL never
  // moves — the record cannot be linked, bookmarked or reloaded.
  const [pressed, setPressed] = useState(false);

  return (
    <div className="h-44 w-full overflow-hidden rounded-lg border">
      <DetailViewShell
        open
        onOpenChange={() => {}}
        mode="fullscreen"
        ariaLabel="Routing inside the shell (anti-example)"
        header={
          <header className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
            <h3 className="min-w-0 flex-1 truncate text-sm font-medium">Release notes for 2.4</h3>
            <button
              type="button"
              onClick={() => setPressed(true)}
              className="focus-visible:ring-ring rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
            >
              Open full page
            </button>
          </header>
        }
        attributes={
          <div className="flex flex-col gap-3 p-4">
            <DetailFields fields={FIELDS.slice(0, 2)} />
            <p className="text-foreground text-sm">
              {pressed ? "Nothing navigated. The URL is unchanged." : "Press Open full page."}
            </p>
          </div>
        }
      />
    </div>
  );
}
