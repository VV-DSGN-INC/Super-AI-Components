import * as React from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Disclaimer Note — "AI can make mistakes" footnote
 *
 * Spec: docs/design-system/component-specs.md#n3-disclaimer-note
 * States: under-composer · in-card · inline
 */
type DisclaimerNoteVariant = "under-composer" | "in-card" | "inline";

/** Reads fine as a sentence on its own, so it still lands if the icon never loads. */
const DEFAULT_TEXT = "AI can make mistakes. Check important info.";

interface DisclaimerNoteProps extends Omit<React.ComponentProps<"div">, "children"> {
  variant?: DisclaimerNoteVariant;
  /** Defaults to a generic "AI can make mistakes" message; override for a product-specific one. */
  children?: React.ReactNode;
  /** Optional "Learn more"-style link. Always needs its own discernible text — never a bare icon. */
  link?: { label: string; href: string };
}

// Deliberately no `dismissed` state and no close button: the spec is explicit
// that a disclaimer permanent enough to be trusted cannot be dismissible. If
// the message is worth showing, it stays mounted for the lifetime of the
// output it qualifies.
function DisclaimerNote({ variant = "inline", children, link, className, ...props }: DisclaimerNoteProps) {
  return (
    <div
      data-slot="disclaimer-note"
      data-variant={variant}
      className={cn(
        // text-foreground, not text-muted-foreground: this note sits on whatever
        // surface it's dropped into (card, popover, plain background), and
        // text-muted-foreground measures under the 4.5:1 minimum against this
        // token set's muted/accent/secondary surfaces. Quietness comes from
        // size and a de-emphasized icon, never from a low-contrast foreground.
        "text-foreground flex items-start gap-1.5 text-xs leading-snug",
        variant === "under-composer" && "justify-center px-2 pt-1.5 text-center",
        variant === "in-card" && "border-t px-3 py-2",
        variant === "inline" && "inline-flex items-center gap-1",
        className,
      )}
      {...props}
    >
      <Info
        aria-hidden="true"
        data-slot="disclaimer-note-icon"
        className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
      />
      <span data-slot="disclaimer-note-text">
        {children ?? DEFAULT_TEXT}
        {link ? (
          <>
            {" "}
            <a
              data-slot="disclaimer-note-link"
              href={link.href}
              className="hover:text-foreground/70 underline underline-offset-2"
            >
              {link.label}
            </a>
          </>
        ) : null}
      </span>
    </div>
  );
}

export { DisclaimerNote };
export type { DisclaimerNoteProps, DisclaimerNoteVariant };
