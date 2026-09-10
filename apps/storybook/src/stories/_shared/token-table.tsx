import * as React from "react";
import { Unstyled } from "@storybook/addon-docs/blocks";

/** One swatch per theme, read from the cascade rather than restated, so
 *  `src/index.css` stays the only copy of every value. The dark swatch sits
 *  inside its own `.dark` scope so the `.dark { --x }` block resolves for it
 *  without flipping the page. */
function Swatch({ token, dark }: { token: string; dark?: boolean }) {
  return (
    <span className={dark ? "dark bg-background inline-block rounded-md p-1" : "inline-block p-1"}>
      <span
        className="border-border block size-8 rounded-md border"
        style={{ background: `var(${token})` }}
      />
    </span>
  );
}

/** A list of CSS variables with their light and dark values drawn live. */
function TokenTable({ tokens }: { tokens: string[] }) {
  return (
    <Unstyled>
      <ul className="my-4 grid list-none gap-2 p-0 font-sans sm:grid-cols-2">
        {tokens.map((token) => (
          <li key={token} className="border-border flex items-center gap-3 rounded-lg border px-3 py-2">
            <Swatch token={token} />
            <Swatch token={token} dark />
            <code className="text-muted-foreground text-xs">{token}</code>
          </li>
        ))}
      </ul>
    </Unstyled>
  );
}

export { TokenTable };
