"use client";

import { CircleAlert, Coins, Play, RotateCw } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Widget, WidgetAction, type WidgetSize } from "@/registry/super-ai/widget";

/**
 * Live examples for widget.docs.tsx, and the fixture bodies the demo and the
 * stories share so the tile content is written once.
 *
 * A client sidecar: the docs module is plain data read by a Server Component,
 * so every element that carries a handler lives here and crosses into the
 * docs as a zero-prop element.
 *
 * Fixture vocabulary: a team's generation workspace. Credits left 360 of
 * 2,000 (resets Nov 1); 26 runs overnight, 3 failed, 2 of them timed out;
 * 3 runs going now.
 */

/** The cell a grid would hand the tile. The tile never sets its own width. */
export const CELL: Record<WidgetSize, string> = {
  small: "h-36 w-36",
  medium: "h-36 w-72",
  large: "h-72 w-72",
};

export const RUNNING = [
  { name: "Podcast intro, music bed", percent: 64 },
  { name: "Spring campaign, poster variant C", percent: 30 },
  { name: "Onboarding video, scene 5", percent: 12 },
] as const;

export const CREDITS_OPEN_LABEL = "Credits left, 360 of 2,000. Ask how much was spent this week";
export const FAILED_OPEN_LABEL = "Failed overnight, 3 of 26 runs. Ask what failed";
export const RUNNING_OPEN_LABEL = "Running now, 3 runs. Ask which one finishes first";

function Figure({ value, caption }: { value: string; caption: string }) {
  return (
    <p className="flex flex-col">
      <span className="text-2xl leading-tight font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </p>
  );
}

/** The body of "Credits left" at each size. */
export function CreditsBody({ size }: { size: WidgetSize }) {
  if (size === "small") return <Figure value="360" caption="of 2,000" />;
  return (
    <div className="flex flex-col gap-2">
      <Figure value="360" caption="of 2,000 credits" />
      <Progress value={18} aria-label="Credits left, 18 percent of the plan" />
    </div>
  );
}

/** The body of "Failed overnight" at each size. */
export function FailedBody({ size }: { size: WidgetSize }) {
  if (size === "small") return <Figure value="3" caption="of 26 runs" />;
  return (
    <div className="flex flex-col gap-1">
      <Figure value="3" caption="of 26 runs" />
      <p className="text-xs">2 timed out</p>
    </div>
  );
}

/** The body of "Running now": three runs with their progress. Needs medium or large. */
export function RunningBody({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-3">
      {RUNNING.slice(0, rows).map((run) => (
        <li key={run.name} className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate">{run.name}</span>
            <span className="shrink-0 tabular-nums">{run.percent}%</span>
          </span>
          <Progress value={run.percent} aria-label={`${run.name}, ${run.percent} percent`} />
        </li>
      ))}
    </ul>
  );
}

export function CreditsTile({ size = "small" }: { size?: WidgetSize }) {
  return (
    <div className={CELL[size]}>
      <Widget size={size} title="Credits left" icon={<Coins />} meta="Resets Nov 1">
        <CreditsBody size={size} />
      </Widget>
    </div>
  );
}

/* ---- Examples referenced from widget.docs.tsx ---- */

export function OpenLabelStatesTheFact() {
  return (
    <div className={CELL.small}>
      <Widget
        size="small"
        title="Credits left"
        icon={<Coins />}
        onOpen={() => {}}
        openLabel={CREDITS_OPEN_LABEL}
      >
        <CreditsBody size="small" />
      </Widget>
    </div>
  );
}

export function OpenLabelRepeatsTheTitle() {
  return (
    <div className={CELL.small}>
      <Widget size="small" title="Credits left" icon={<Coins />} onOpen={() => {}} openLabel="Credits left">
        <CreditsBody size="small" />
      </Widget>
    </div>
  );
}

export function OneActionInTheHeader() {
  return (
    <div className={CELL.medium}>
      <Widget
        size="medium"
        title="Failed overnight"
        icon={<CircleAlert />}
        action={
          <WidgetAction label="Retry 2 timed-out runs" onClick={() => {}}>
            <RotateCw />
          </WidgetAction>
        }
      >
        <FailedBody size="medium" />
      </Widget>
    </div>
  );
}

export function HiddenHeaderKeepsTheAction() {
  return (
    <div className={CELL.medium}>
      <Widget
        size="medium"
        title="Failed overnight"
        hideHeader
        action={
          <WidgetAction label="Retry 2 timed-out runs" onClick={() => {}}>
            <RotateCw />
          </WidgetAction>
        }
      >
        <FailedBody size="medium" />
      </Widget>
    </div>
  );
}

export function TooMuchForTheTile() {
  return (
    <div className={CELL.medium}>
      <Widget size="medium" title="Running now" icon={<Play />} meta="3 runs">
        <RunningBody />
      </Widget>
    </div>
  );
}

export function LoadingKeepsTheShape() {
  return (
    <div className={CELL.medium}>
      <Widget size="medium" title="Running now" icon={<Play />} meta="3 runs" loading>
        <RunningBody />
      </Widget>
    </div>
  );
}

export function SizeFitsTheContent() {
  return (
    <div className={CELL.large}>
      <Widget size="large" title="Running now" icon={<Play />} meta="3 runs">
        <RunningBody />
      </Widget>
    </div>
  );
}
