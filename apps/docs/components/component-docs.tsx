import type { ReactNode } from "react";
import type { ComponentDocs } from "@/lib/component-docs";
import { cn } from "@/lib/utils";

function Section({ title, slot, children }: { title: string; slot: string; children: ReactNode }) {
  return (
    <section data-slot={slot} className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Guidance({ items, tone }: { items: ComponentDocs["dos"]; tone: "do" | "dont" }) {
  return (
    <div
      data-slot={tone === "do" ? "docs-do" : "docs-dont"}
      className={cn(
        "space-y-3 rounded-lg border p-4",
        tone === "do" ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5",
      )}
    >
      <p className="text-sm font-medium">{tone === "do" ? "Do" : "Don't"}</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.text} className="space-y-2">
            <p className="text-muted-foreground text-sm">{item.text}</p>
            {item.example ? <div className="rounded-md border p-3">{item.example}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComponentDocsView({ docs }: { docs: ComponentDocs }) {
  return (
    <div data-slot="component-docs" className="space-y-8">
      <Section title="What it is" slot="docs-what">
        <p className="text-muted-foreground text-sm">{docs.whatItIs}</p>
      </Section>

      <Section title="Why it matters" slot="docs-why">
        <p className="text-muted-foreground text-sm">{docs.whyItMatters}</p>
        {docs.evidence.length ? (
          <p className="text-muted-foreground text-xs">Observed in: {docs.evidence.join(" · ")}</p>
        ) : null}
      </Section>

      {docs.anatomy.length ? (
        <Section title="Anatomy" slot="docs-anatomy">
          <ol className="space-y-2">
            {docs.anatomy.map((slot, i) => (
              <li key={slot.slot} className="flex items-start gap-3 text-sm">
                <span className="bg-muted flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                  {i + 1}
                </span>
                <span>
                  <code className="text-xs">{slot.slot}</code>
                  <span className="text-muted-foreground ml-2">{slot.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      <Section title="How to use it" slot="docs-usage">
        <p className="text-muted-foreground text-sm">{docs.usage}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Guidance items={docs.dos} tone="do" />
          <Guidance items={docs.donts} tone="dont" />
        </div>
      </Section>

      {docs.pitfalls.length ? (
        <Section title="Watch out for" slot="docs-pitfalls">
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            {docs.pitfalls.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
