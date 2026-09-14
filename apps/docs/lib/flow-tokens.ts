import type { CssVars } from "./manifest-types";

/**
 * Family G colour and motion tokens, shipped to consumers as registry cssVars
 * so `npx shadcn add typed-handle` installs the scale alongside the code.
 * Values are defined once here, mirrored by hand into app/globals.css and the
 * Storybook index.css, and asserted equal by flow-types.test.tsx.
 *
 * Grouping, from the FilmMaker port vocabulary (spec, Contracts): neutral for
 * text, blue for visual media, purple for anything audible, tan for identity
 * and geometry. Status colours reuse the type scale where the meaning matches
 * (streaming = image blue, done = a green not otherwise in the system).
 *
 * They are split into three exports by OWNER rather than shipped as one blob,
 * because `cssvars-liveness.test.ts` holds every declared key to being read by
 * the item that declares it, and a component that declares the whole family
 * would declare eleven keys it never names. The split states who owns what:
 *
 * - the type palette belongs to the `flow-types` contract, which is where the
 *   handle-type registry maps a type to its var and where every flow component
 *   looks the colour up at runtime;
 * - the status colours belong to `node-status`, the one component that turns a
 *   status into a glyph, and the only place their names appear in source;
 * - the dash animation belongs to `typed-edge`, the only thing that animates.
 */

/** The ten handle-type colours. Owned by the `flow-types` contract. */
export const FLOW_TYPE_CSS_VARS: CssVars = {
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
  },
};

/** The four status colours. Owned by `node-status`. */
export const FLOW_STATUS_CSS_VARS: CssVars = {
  light: {
    "flow-queued": "var(--muted-foreground)",
    "flow-streaming": "oklch(0.62 0.19 259.8)",
    "flow-done": "oklch(0.72 0.17 162.5)",
    "flow-failed": "var(--destructive)",
  },
  dark: {
    "flow-streaming": "oklch(0.71 0.16 259.8)",
    "flow-done": "oklch(0.77 0.15 162.5)",
  },
};

/** The streaming dash animation. Owned by `typed-edge`, paired with FLOW_CSS. */
export const FLOW_MOTION_CSS_VARS: CssVars = {
  theme: {
    "animate-flow-dash": "flow-dash 1s linear infinite",
  },
};

/**
 * The union of the three, which is what the two stylesheets must carry. Not
 * declared by any registry item — `flow-types.test.tsx` reads it to assert the
 * stylesheets and the shipped tokens cannot drift apart.
 */
export const FLOW_CSS_VARS: CssVars = {
  theme: { ...FLOW_MOTION_CSS_VARS.theme },
  light: { ...FLOW_TYPE_CSS_VARS.light, ...FLOW_STATUS_CSS_VARS.light },
  dark: { ...FLOW_TYPE_CSS_VARS.dark, ...FLOW_STATUS_CSS_VARS.dark },
};

/** The one keyframe the family needs: the streaming edge dash. */
export const FLOW_CSS = {
  "@keyframes flow-dash": { to: { "stroke-dashoffset": "-20" } },
} as const;
