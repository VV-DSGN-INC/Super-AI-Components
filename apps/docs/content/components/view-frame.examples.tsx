"use client";

import { Pin, RotateCw, Undo2, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ViewFrame,
  ViewFrameAction,
  ViewFrameActions,
  ViewFrameContent,
  ViewFrameDescription,
  ViewFrameFoot,
  ViewFrameFooter,
  ViewFrameHeader,
  ViewFrameTitle,
} from "@/registry/super-ai/view-frame";

const ROWS = [
  "Tue 02:14 · Onboarding video · Scene 3: dashboard tour, slow pan · Timed out",
  "Tue 02:31 · Onboarding video · Scene 4: settings walkthrough · Timed out",
  "Mon 23:05 · Spring campaign · Poster variant B, crowd at night · Content filter",
];

function Rows() {
  return (
    <ul className="flex flex-col gap-2">
      {ROWS.map((row) => (
        <li key={row} className="rounded-lg border p-3">
          {row}
        </li>
      ))}
    </ul>
  );
}

function Chrome({
  children,
  actions,
  foot,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  foot?: React.ReactNode;
}) {
  return (
    <div className="h-72 w-full max-w-xl">
      <ViewFrame title="Failed runs this week">
        <ViewFrameHeader>
          <ViewFrameTitle>Failed runs this week</ViewFrameTitle>
          <ViewFrameDescription>All projects · updated just now</ViewFrameDescription>
          <ViewFrameActions>
            {actions ?? (
              <>
                <ViewFrameAction label="Undo">
                  <Undo2 />
                </ViewFrameAction>
                <ViewFrameAction label="Rerun">
                  <RotateCw />
                </ViewFrameAction>
                <ViewFrameAction label="Pin">
                  <Pin />
                </ViewFrameAction>
                <ViewFrameAction label="Close">
                  <X />
                </ViewFrameAction>
              </>
            )}
          </ViewFrameActions>
        </ViewFrameHeader>
        <ViewFrameContent>{children}</ViewFrameContent>
        {foot ? <ViewFrameFoot>{foot}</ViewFrameFoot> : null}
        <ViewFrameFooter origin="Made in chat: Track failed runs" version="v2 · board" />
      </ViewFrame>
    </div>
  );
}

/** Do: the caller renders the mode tabs, panelless, inside the actions. */
export function ModesLiveInActions() {
  return (
    <Chrome
      actions={
        <Tabs defaultValue="table">
          <TabsList variant="line">
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <Rows />
    </Chrome>
  );
}

/** Do: a failed run keeps the chrome and puts the alert and Retry in the body. */
export function FailureStaysInBody() {
  return (
    <Chrome>
      <Alert variant="destructive">
        <AlertDescription>This view could not run. The runs service did not answer.</AlertDescription>
        <Button className="mt-2 w-fit">Retry</Button>
      </Alert>
    </Chrome>
  );
}

/** Do: the ask bar goes in the foot, in flow, so it never covers the last row. */
export function AskBarInTheFoot() {
  return (
    <Chrome foot={<Input aria-label="Ask about this view" placeholder="Ask about this view" />}>
      <Rows />
    </Chrome>
  );
}

/** Don't: an ask bar pinned over the body hides the rows it sits on. */
export function AskBarOverTheBody() {
  return (
    <div className="h-72 w-full max-w-xl">
      <ViewFrame title="Failed runs this week" className="relative">
        <ViewFrameHeader>
          <ViewFrameTitle>Failed runs this week</ViewFrameTitle>
        </ViewFrameHeader>
        <ViewFrameContent>
          <Rows />
        </ViewFrameContent>
        <div className="absolute inset-x-3 bottom-10 rounded-lg bg-background p-2 ring-1 ring-foreground/10">
          <Input aria-label="Ask about this view" placeholder="Ask about this view" />
        </div>
      </ViewFrame>
    </div>
  );
}

/** Don't: a second scroller inside the body gives two scrollbars and two tab stops. */
export function SecondScrollerInBody() {
  return (
    <Chrome>
      <div tabIndex={0} role="region" aria-label="Rows" className="h-24 overflow-auto rounded-lg border">
        <Rows />
      </div>
    </Chrome>
  );
}
