"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Preview Scene — stand-in artwork for anything that displays generated media.
 *
 * Every media component in this registry takes its picture as a node
 * (`thumbnail`, `media`, `children`) and has no opinion about what that node
 * is. Demos, stories and examples therefore have to supply something, and for
 * most of this registry's life that something was a `bg-muted` rectangle or a
 * `placehold.co` URL. Both fail the same way: a preset grid whose eight style
 * presets are eight identical grey squares is not showing you a style picker,
 * it is showing you the absence of one.
 *
 * ## Why this is allowed to be in colour
 *
 * The palette here is monochrome on purpose (`globals.css`: "The system is
 * otherwise monochrome + --destructive"), and the token gate holds registry
 * source to it. This file is a deliberate, narrow exception, on one principle:
 *
 *   **The interface stays monochrome. The content it depicts does not.**
 *
 * These scenes stand in for photographs and artwork a user generated. That is
 * content, not chrome. It is also load-bearing rather than decorative: a
 * filter row (`vivid` / `mono` / `warm` / `cool` / `faded`) and a colour-grade
 * control cannot demonstrate anything against a greyscale subject, because the
 * whole point of the control is what it does to colour.
 *
 * The mechanism is the one `WARNING_CSS_VARS` already established in
 * `catalog.manifest.ts` for `--warning`: the six `--scene-*` values live in
 * the manifest and ship as registry `cssVars`, so `npx shadcn add` installs
 * them alongside the file, and this source only ever names them. No literal
 * colour appears below, which is what keeps `check:tokens` honest rather than
 * merely quiet.
 *
 * ## Three axes
 *
 * - `subject`   — *what* is depicted. Geometry only.
 * - `treatment` — *how* it is rendered. Cel, line, wash and pixel are not
 *                 hues, they are rendering treatments, which is why a style
 *                 row reads as a style row even before colour is involved.
 *                 (Named `treatment`, not `style`, because an svg element
 *                 already has a `style` prop and shadowing it would cost
 *                 every consumer their inline styles.)
 * - `grade`     — the colour transform, expressed purely as `feColorMatrix`
 *                 arithmetic. Grading a real photograph is exactly this, so
 *                 the filter row is honest rather than illustrative.
 *
 * A style picker crosses one subject with every treatment. A filter picker
 * crosses one subject and treatment with every grade. An environment picker
 * crosses one treatment and grade with every subject. All three are this one
 * component.
 *
 * `tint` and `variant` exist so a gallery of twelve items is not twelve copies
 * of one picture: `tint` rotates hue (no extra tokens needed for a fifth or
 * sixth palette), `variant` nudges geometry. Both are plain numbers rather
 * than randomness, because a scene that differs between server and client
 * render is a hydration error.
 */

type SceneSubject = "landscape" | "portrait" | "city" | "interior" | "product" | "abstract";
type SceneTreatment = "soft" | "cel" | "line" | "wash" | "pixel";
type SceneGrade = "none" | "vivid" | "mono" | "warm" | "cool" | "faded" | "noir";

/**
 * A shape names the part it plays, never the colour it is. That indirection is
 * what lets one geometry serve five treatments: `line` paints every role as a
 * stroke, `wash` paints the same roles as bleeding fills, and neither has to
 * know what a mountain is.
 */
type SceneRole = "sky" | "ground" | "subject" | "accent" | "shadow" | "highlight";

type SceneShape =
  | { kind: "rect"; role: SceneRole; x: number; y: number; w: number; h: number; r?: number }
  | { kind: "circle"; role: SceneRole; cx: number; cy: number; r: number }
  | { kind: "ellipse"; role: SceneRole; cx: number; cy: number; rx: number; ry: number }
  | { kind: "path"; role: SceneRole; d: string };

/**
 * Deliberately narrower than `React.SVGProps`: spreading `SVGProps<SVGElement>`
 * onto a `<rect>` fails on `ref` variance, and a paint object has no business
 * carrying a ref anyway.
 */
interface ScenePaint {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinejoin?: "round";
  strokeLinecap?: "round";
  opacity?: number;
  shapeRendering?: "crispEdges";
}

const SCENE_SUBJECTS: SceneSubject[] = ["landscape", "portrait", "city", "interior", "product", "abstract"];
const SCENE_TREATMENTS: SceneTreatment[] = ["soft", "cel", "line", "wash", "pixel"];
const SCENE_GRADES: SceneGrade[] = ["none", "vivid", "mono", "warm", "cool", "faded", "noir"];

const ROLE_VAR: Record<SceneRole, string> = {
  sky: "var(--scene-sky)",
  ground: "var(--scene-ground)",
  subject: "var(--scene-subject)",
  accent: "var(--scene-accent)",
  shadow: "var(--scene-shadow)",
  highlight: "var(--scene-highlight)",
};

/**
 * Deterministic stand-in for a random jitter. `variant` is an author-supplied
 * index (a frame number, a grid position), so the same input always draws the
 * same picture on the server and in the browser.
 */
function wobble(variant: number, step: number, amplitude: number) {
  const n = Math.abs(Math.sin((variant + 1) * (step + 1) * 1.7));
  return (n * 2 - 1) * amplitude;
}

// ---------------------------------------------------------------------------
// Geometry. Every subject draws into a 0 0 100 100 box and is sliced to fit
// whatever aspect the host tile sets, so a scene works in a square preset
// tile, a 21/9 hero and a 3/4 portrait card without a second set of drawings.
// ---------------------------------------------------------------------------

function landscape(v: number): SceneShape[] {
  const sun = 24 + wobble(v, 1, 16);
  const peak = 46 + wobble(v, 2, 10);
  return [
    { kind: "rect", role: "sky", x: 0, y: 0, w: 100, h: 64 },
    { kind: "circle", role: "highlight", cx: sun, cy: 21, r: 8.5 },
    { kind: "path", role: "accent", d: "M0 64 L21 41 L41 64 Z" },
    { kind: "path", role: "subject", d: `M14 64 L${peak} 27 L82 64 Z` },
    { kind: "path", role: "shadow", d: "M58 64 L80 44 L100 64 Z" },
    { kind: "rect", role: "ground", x: 0, y: 64, w: 100, h: 36 },
    { kind: "path", role: "highlight", d: "M0 73 Q 28 69 56 75 T 100 72 L100 79 L0 79 Z" },
    { kind: "path", role: "shadow", d: "M0 88 Q 34 83 68 89 T 100 86 L100 100 L0 100 Z" },
  ];
}

function portrait(v: number): SceneShape[] {
  const lean = wobble(v, 3, 3);
  return [
    { kind: "rect", role: "sky", x: 0, y: 0, w: 100, h: 100 },
    // Backdrop falloff, deliberately pushed off-centre. Centred on the head it
    // reads as a bullseye rather than as studio lighting, which is exactly how
    // the first version of this scene failed.
    { kind: "ellipse", role: "accent", cx: 74, cy: 24, rx: 48, ry: 42 },
    { kind: "path", role: "subject", d: `M8 100 Q 15 68 ${50 + lean} 68 Q ${85 + lean} 68 92 100 Z` },
    // Neck, drawn before the head so the head's edge sits over it. Without it
    // the head is a ball floating above a pair of shoulders.
    { kind: "rect", role: "subject", x: 42 + lean, y: 50, w: 16, h: 22 },
    { kind: "ellipse", role: "subject", cx: 50 + lean, cy: 39, rx: 17, ry: 20 },
    {
      kind: "path",
      role: "shadow",
      d: `M${33 + lean} 39 Q ${32 + lean} 17 ${50 + lean} 17 Q ${68 + lean} 17 ${67 + lean} 39 Q ${63 + lean} 27 ${50 + lean} 26 Q ${37 + lean} 27 ${33 + lean} 39 Z`,
    },
    {
      kind: "path",
      role: "highlight",
      d: `M${62 + lean} 31 Q ${67 + lean} 40 ${61 + lean} 51 Q ${64 + lean} 40 ${62 + lean} 31 Z`,
    },
    {
      kind: "path",
      role: "ground",
      d: `M${38 + lean} 69 Q ${50 + lean} 79 ${62 + lean} 69 L${64 + lean} 78 Q ${50 + lean} 88 ${36 + lean} 78 Z`,
    },
  ];
}

function city(v: number): SceneShape[] {
  const heights = [46, 32, 58, 26, 50, 38, 62, 30];
  const towers: SceneShape[] = heights.map((h, i) => {
    const height = h + wobble(v, i, 7);
    return {
      kind: "rect" as const,
      role: (i % 3 === 0 ? "shadow" : "subject") as SceneRole,
      x: i * 12.5,
      y: 100 - height - 14,
      w: 11,
      h: height,
    };
  });
  // Lit windows, thinned to a readable handful rather than a full grid: at a
  // 96px preset tile a real grid turns into noise.
  const windows: SceneShape[] = heights.flatMap((h, i) =>
    [0, 1].map((row) => ({
      kind: "rect" as const,
      role: "highlight" as SceneRole,
      x: i * 12.5 + 3,
      y: 100 - h - 6 + row * 11,
      w: 4.5,
      h: 5,
    })),
  );
  return [
    { kind: "rect", role: "sky", x: 0, y: 0, w: 100, h: 100 },
    { kind: "circle", role: "highlight", cx: 78 + wobble(v, 4, 10), cy: 20, r: 7 },
    ...towers,
    ...windows,
    { kind: "rect", role: "ground", x: 0, y: 86, w: 100, h: 14 },
    { kind: "path", role: "accent", d: "M0 90 L100 90 L100 92 L0 92 Z" },
  ];
}

function interior(v: number): SceneShape[] {
  const win = 10 + wobble(v, 5, 6);
  return [
    { kind: "rect", role: "sky", x: 0, y: 0, w: 100, h: 76 },
    { kind: "rect", role: "ground", x: 0, y: 76, w: 100, h: 24 },
    { kind: "rect", role: "accent", x: win, y: 15, w: 36, h: 36, r: 2 },
    { kind: "rect", role: "highlight", x: win + 17, y: 15, w: 2, h: 36 },
    { kind: "rect", role: "highlight", x: win, y: 32, w: 36, h: 2 },
    // The light spill is what makes the room read as a room rather than as
    // three stacked rectangles.
    { kind: "path", role: "highlight", d: `M${win} 51 L${win + 36} 51 L${win + 56} 100 L${win - 6} 100 Z` },
    { kind: "path", role: "subject", d: "M62 76 L62 52 Q 62 46 70 46 L84 46 Q 92 46 92 52 L92 76 Z" },
    { kind: "rect", role: "shadow", x: 62, y: 74, w: 30, h: 4 },
    { kind: "ellipse", role: "shadow", cx: 77, cy: 80, rx: 20, ry: 3.5 },
  ];
}

function product(v: number): SceneShape[] {
  const shift = wobble(v, 6, 5);
  return [
    { kind: "rect", role: "sky", x: 0, y: 0, w: 100, h: 100 },
    // A backdrop sweep, the cyclorama every product shot is lit against.
    { kind: "path", role: "accent", d: "M0 58 Q 50 40 100 58 L100 100 L0 100 Z" },
    { kind: "ellipse", role: "shadow", cx: 50 + shift, cy: 82, rx: 26, ry: 5 },
    {
      kind: "path",
      role: "subject",
      d: `M${40 + shift} 82 L${40 + shift} 44 Q ${40 + shift} 36 ${46 + shift} 33 L${46 + shift} 24 L${54 + shift} 24 L${54 + shift} 33 Q ${60 + shift} 36 ${60 + shift} 44 L${60 + shift} 82 Z`,
    },
    {
      kind: "path",
      role: "highlight",
      d: `M${44 + shift} 46 L${47 + shift} 46 L${47 + shift} 76 L${44 + shift} 76 Z`,
    },
    { kind: "rect", role: "ground", x: 42 + shift, y: 54, w: 16, h: 11, r: 1 },
    { kind: "ellipse", role: "highlight", cx: 24, cy: 30, rx: 12, ry: 12 },
  ];
}

function abstract(v: number): SceneShape[] {
  return [
    { kind: "rect", role: "sky", x: 0, y: 0, w: 100, h: 100 },
    { kind: "circle", role: "accent", cx: 36 + wobble(v, 7, 12), cy: 40, r: 27 },
    { kind: "circle", role: "subject", cx: 64 + wobble(v, 8, 10), cy: 58, r: 23 },
    { kind: "path", role: "highlight", d: `M0 ${72 + wobble(v, 9, 8)} Q 30 52 58 70 T 100 62 L100 100 L0 100 Z` },
    { kind: "path", role: "shadow", d: "M18 12 Q 52 4 84 18 L84 24 Q 52 12 18 20 Z" },
    { kind: "ellipse", role: "ground", cx: 80, cy: 26, rx: 14, ry: 9 },
  ];
}

const GEOMETRY: Record<SceneSubject, (variant: number) => SceneShape[]> = {
  landscape,
  portrait,
  city,
  interior,
  product,
  abstract,
};

// ---------------------------------------------------------------------------
// Grading. Pure matrix arithmetic — no colour literal appears here, which is
// both why the token gate stays satisfied and why these behave like real
// grades: they transform whatever colour the scene happens to be.
// ---------------------------------------------------------------------------

function GradeFilter({ id, grade }: { id: string; grade: SceneGrade }) {
  if (grade === "none") return null;
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      {grade === "vivid" ? (
        <>
          <feColorMatrix type="saturate" values="1.75" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.12" intercept="-0.05" />
            <feFuncG type="linear" slope="1.12" intercept="-0.05" />
            <feFuncB type="linear" slope="1.12" intercept="-0.05" />
          </feComponentTransfer>
        </>
      ) : null}
      {grade === "mono" ? <feColorMatrix type="saturate" values="0" /> : null}
      {grade === "warm" ? (
        <feColorMatrix
          type="matrix"
          values="1.12 0.04 0 0 0.03  0.02 1.02 0 0 0.01  0 0.02 0.82 0 -0.01  0 0 0 1 0"
        />
      ) : null}
      {grade === "cool" ? (
        <feColorMatrix
          type="matrix"
          values="0.84 0 0.04 0 -0.01  0 1 0.04 0 0.01  0.02 0.06 1.14 0 0.03  0 0 0 1 0"
        />
      ) : null}
      {grade === "faded" ? (
        <>
          <feColorMatrix type="saturate" values="0.6" />
          {/* Lifted blacks and pulled highlights: the film-stock look, and the
              reason `faded` has to be a transfer curve rather than opacity. */}
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.72" intercept="0.16" />
            <feFuncG type="linear" slope="0.72" intercept="0.16" />
            <feFuncB type="linear" slope="0.7" intercept="0.19" />
          </feComponentTransfer>
        </>
      ) : null}
      {grade === "noir" ? (
        <>
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.7" intercept="-0.36" />
            <feFuncG type="linear" slope="1.7" intercept="-0.36" />
            <feFuncB type="linear" slope="1.7" intercept="-0.36" />
          </feComponentTransfer>
        </>
      ) : null}
    </filter>
  );
}

function TreatmentFilter({ id, treatment }: { id: string; treatment: SceneTreatment }) {
  if (treatment === "cel") return null;
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      {treatment === "soft" ? <feGaussianBlur stdDeviation="0.7" /> : null}
      {treatment === "wash" ? (
        <>
          <feGaussianBlur stdDeviation="2.4" />
          {/* Pushing alpha back up after a heavy blur keeps the edges soft
              without dissolving the shape into the background. */}
          <feComponentTransfer>
            <feFuncA type="linear" slope="1.5" intercept="-0.08" />
          </feComponentTransfer>
        </>
      ) : null}
      {treatment === "line" ? <feGaussianBlur stdDeviation="0.15" /> : null}
      {treatment === "pixel" ? (
        <>
          {/* There is no pixelate primitive in SVG. The portable fake: flood a
              one-unit cell, composite it out to a 5-unit tile, repeat that
              tile across the canvas, clip the source to it, then dilate each
              surviving dot back out to fill its cell. */}
          <feFlood x="1" y="1" width="1" height="1" floodColor="var(--scene-highlight)" result="cell" />
          <feComposite in="cell" width="5" height="5" />
          <feTile result="grid" />
          <feComposite in="SourceGraphic" in2="grid" operator="in" />
          <feMorphology operator="dilate" radius="2.5" />
        </>
      ) : null}
    </filter>
  );
}

// ---------------------------------------------------------------------------
// Painting. One branch per treatment, each deciding how a role becomes paint.
// ---------------------------------------------------------------------------

function shapeElement(shape: SceneShape, index: number, paint: ScenePaint) {
  const key = `${shape.kind}-${index}`;
  switch (shape.kind) {
    case "rect":
      return <rect key={key} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.r} {...paint} />;
    case "circle":
      return <circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} {...paint} />;
    case "ellipse":
      return <ellipse key={key} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...paint} />;
    case "path":
      return <path key={key} d={shape.d} {...paint} />;
  }
}

function paintFor(treatment: SceneTreatment, shape: SceneShape, gradientId: string): ScenePaint {
  const colour = ROLE_VAR[shape.role];

  // The backdrop is filled in every treatment. A sketch of a landscape still
  // sits on paper, and leaving `sky` unfilled in `line` shows the tile's own
  // `bg-muted` through, which is the grey rectangle this file exists to remove.
  const isBackdrop = shape.role === "sky";

  switch (treatment) {
    case "cel":
      return {
        fill: colour,
        stroke: ROLE_VAR.shadow,
        strokeWidth: isBackdrop ? 0 : 0.7,
        strokeLinejoin: "round",
      };
    case "soft":
      return { fill: isBackdrop ? `url(#${gradientId})` : colour, stroke: "none" };
    case "wash":
      return { fill: colour, stroke: "none", opacity: isBackdrop ? 1 : 0.72 };
    case "line":
      return isBackdrop
        ? { fill: colour, stroke: "none" }
        : {
            fill: "none",
            stroke: ROLE_VAR.shadow,
            strokeWidth: 0.9,
            strokeLinejoin: "round",
            strokeLinecap: "round",
          };
    case "pixel":
      return { fill: colour, stroke: "none", shapeRendering: "crispEdges" };
  }
}

interface PreviewSceneProps extends Omit<React.ComponentProps<"svg">, "role"> {
  subject?: SceneSubject;
  treatment?: SceneTreatment;
  grade?: SceneGrade;
  /** Hue rotation in degrees. Varies a gallery without shipping a second palette. */
  tint?: number;
  /** Deterministic geometry index. Same number in, same picture out. */
  variant?: number;
  /**
   * Omit and the scene is `aria-hidden`, which is right nearly everywhere: it
   * sits inside a tile that already carries a real label, and announcing
   * "abstract scene" next to "Watercolor" is noise. Pass it only when the
   * picture is the sole thing identifying its cell.
   */
  label?: string;
}

function PreviewScene({
  subject = "landscape",
  treatment = "soft",
  grade = "none",
  tint = 0,
  variant = 0,
  label,
  className,
  ...props
}: PreviewSceneProps) {
  // React's own ids carry colons (`:r0:`), and a colon inside `url(#…)` is a
  // silent no-op in some engines — the filter simply never applies. Strip to
  // alphanumerics rather than debugging that later.
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const treatmentFilterId = `${uid}-treatment`;
  const gradeFilterId = `${uid}-grade`;
  const tintFilterId = `${uid}-tint`;
  const gradientId = `${uid}-sky`;

  const shapes = GEOMETRY[subject](variant);

  // Nested groups rather than a space-separated filter list on one element:
  // a filter-value-list is only reliable through the CSS property, not the SVG
  // attribute. Innermost applies first, so the order below reads outward as
  // grade(tint(treatment(shapes))) — the treatment is part of the picture, and
  // grading happens to the finished picture, which is the order a real
  // pipeline runs in.
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      data-slot="preview-scene"
      data-subject={subject}
      data-treatment={treatment}
      data-grade={grade}
      className={cn("block h-full w-full", className)}
      {...(label ? { role: "img" } : { "aria-hidden": true })}
      {...props}
    >
      {label ? <title>{label}</title> : null}
      <defs>
        <TreatmentFilter id={treatmentFilterId} treatment={treatment} />
        <GradeFilter id={gradeFilterId} grade={grade} />
        {tint ? (
          <filter id={tintFilterId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="hueRotate" values={String(tint)} />
          </filter>
        ) : null}
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ROLE_VAR.highlight} />
          <stop offset="100%" stopColor={ROLE_VAR.sky} />
        </linearGradient>
      </defs>
      <g filter={grade === "none" ? undefined : `url(#${gradeFilterId})`}>
        <g filter={tint ? `url(#${tintFilterId})` : undefined}>
          <g filter={treatment === "cel" ? undefined : `url(#${treatmentFilterId})`}>
            {shapes.map((shape, index) => shapeElement(shape, index, paintFor(treatment, shape, gradientId)))}
          </g>
        </g>
      </g>
    </svg>
  );
}

export { PreviewScene, SCENE_GRADES, SCENE_SUBJECTS, SCENE_TREATMENTS };
export type { PreviewSceneProps, SceneGrade, SceneRole, SceneSubject, SceneTreatment };
