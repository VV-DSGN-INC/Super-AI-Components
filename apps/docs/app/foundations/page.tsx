const SURFACES = ["background", "card", "muted", "accent", "secondary", "popover"];
const CONTENT = [
  "foreground",
  "muted-foreground",
  "primary",
  "destructive",
  "warning",
  "border",
  "ring",
];
const RADII = [
  "radius-sm",
  "radius-md",
  "radius-lg",
  "radius-xl",
  "radius-2xl",
  "radius-3xl",
  "radius-4xl",
];

function Swatch({ token }: { token: string }) {
  return (
    <div className="space-y-1.5">
      <div
        className="h-14 rounded-md border"
        style={{ background: `var(--${token})` }}
        aria-hidden="true"
      />
      <p className="font-mono text-[11px]">{token}</p>
    </div>
  );
}

export default function Foundations() {
  return (
    <main className="mx-auto max-w-6xl space-y-14 px-6 py-12">
      <header className="max-w-2xl space-y-3">
        <h1 data-slot="page-title" className="text-3xl font-semibold tracking-tight">
          Foundations
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          The token set every component reads. This is stock shadcn base-nova plus one addition,{" "}
          <span className="font-mono text-xs whitespace-nowrap">--warning</span>, which the
          near-limit and over-limit
          states need and which ships with the components that use it.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Surfaces</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SURFACES.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Content and state</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CONTENT.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">The pairing that fails</h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Never put <span className="font-mono text-xs">text-muted-foreground</span> on{" "}
          <span className="font-mono text-xs">bg-muted</span>,{" "}
          <span className="font-mono text-xs">bg-accent</span> or{" "}
          <span className="font-mono text-xs">bg-secondary</span>. Those surfaces sit at the same
          lightness as muted text in this token set, measuring 4.34:1 against a 4.5:1 minimum. When
          a component paints a surface, rebind the variable rather than restyling slots: composed
          children carry their own muted classes and a slot-level override cannot reach them.
        </p>
        <pre className="bg-card overflow-x-auto rounded-md border p-4 font-mono text-xs">
          {`<div className="bg-muted [--muted-foreground:var(--accent-foreground)]">`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Radius</h2>
        <div className="flex flex-wrap gap-4">
          {RADII.map((token) => (
            <div key={token} className="space-y-1.5">
              <div
                className="bg-card size-14 border"
                style={{ borderRadius: `var(--${token})` }}
                aria-hidden="true"
              />
              <p className="font-mono text-[11px]">{token}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Type</h2>
        <div className="space-y-2">
          <p className="text-4xl font-semibold tracking-tight">Display, page titles</p>
          <p className="text-lg font-medium">Heading, section titles</p>
          <p className="text-sm">Body, the default reading size</p>
          <p className="text-muted-foreground text-xs">Caption, metadata and labels</p>
          <p className="font-mono text-sm">Mono, identifiers and commands</p>
        </div>
      </section>
    </main>
  );
}
