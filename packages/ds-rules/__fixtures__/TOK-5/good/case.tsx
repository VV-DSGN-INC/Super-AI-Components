import { cva } from "class-variance-authority";

export const listVariants = cva("text-muted-foreground", {
  variants: { tone: { plain: "bg-card" } },
});
