"use client";

import { CircleAlert, Coins, Play, RotateCw } from "lucide-react";

import {
  CELL,
  CREDITS_OPEN_LABEL,
  CreditsBody,
  FailedBody,
  RunningBody,
} from "@/content/components/widget.examples";
import { Widget, WidgetAction } from "@/registry/super-ai/widget";

export default function WidgetDemo() {
  return (
    <div className="flex flex-wrap items-start gap-3">
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
      <div className={CELL.large}>
        <Widget size="large" title="Running now" icon={<Play />} meta="3 runs">
          <RunningBody />
        </Widget>
      </div>
      <div className={CELL.small}>
        <Widget size="small" title="Running now" icon={<Play />} loading />
      </div>
    </div>
  );
}
