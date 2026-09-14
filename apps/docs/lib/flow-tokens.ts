import type { CssVars } from "./manifest-types";

/**
 * Family G colour and motion tokens, shipped to consumers as registry cssVars
 * (the same mechanism as WARNING_CSS_VARS in catalog.manifest.ts) so `npx
 * shadcn add typed-handle` installs the scale alongside the code. Values are
 * defined once here, mirrored by hand into app/globals.css and the Storybook
 * index.css (Task 1 step 7), and asserted equal by flow-types.test.ts.
 *
 * Grouping, from the FilmMaker port vocabulary (spec, Contracts): neutral for
 * text, blue for visual media, purple for anything audible, tan for identity
 * and geometry. Status colours reuse the type scale where the meaning matches
 * (streaming = image blue, done = a green not otherwise in the system).
 */
export const FLOW_CSS_VARS: CssVars = {
  theme: {
    "animate-flow-dash": "flow-dash 1s linear infinite",
  },
  light: {
    "flow-text": "var(--muted-foreground)",
    "flow-image": "oklch(0.62 0.19 259.8)",
    "flow-video": "oklch(0.61 0.22 292.7)",
    "flow-start-frame": "oklch(0.62 0.19 259.8)",
    "flow-end-frame": "oklch(0.62 0.19 259.8)",
    "flow-audio": "oklch(0.65 0.24 354.3)",
    "flow-speech": "oklch(0.65 0.24 354.3)",
    "flow-sound": "oklch(0.65 0.24 354.3)",
    "flow-3d": "oklch(0.7 0.1 70)",
    "flow-avatar": "oklch(0.7 0.1 70)",
    "flow-queued": "var(--muted-foreground)",
    "flow-streaming": "oklch(0.62 0.19 259.8)",
    "flow-done": "oklch(0.72 0.17 162.5)",
    "flow-failed": "var(--destructive)",
  },
  dark: {
    "flow-image": "oklch(0.71 0.16 259.8)",
    "flow-video": "oklch(0.71 0.18 292.7)",
    "flow-start-frame": "oklch(0.71 0.16 259.8)",
    "flow-end-frame": "oklch(0.71 0.16 259.8)",
    "flow-audio": "oklch(0.73 0.19 354.3)",
    "flow-speech": "oklch(0.73 0.19 354.3)",
    "flow-sound": "oklch(0.73 0.19 354.3)",
    "flow-3d": "oklch(0.78 0.09 72)",
    "flow-avatar": "oklch(0.78 0.09 72)",
    "flow-streaming": "oklch(0.71 0.16 259.8)",
    "flow-done": "oklch(0.77 0.15 162.5)",
  },
};

/** The one keyframe the family needs: the streaming edge dash. */
export const FLOW_CSS = {
  "@keyframes flow-dash": { to: { "stroke-dashoffset": "-20" } },
} as const;
