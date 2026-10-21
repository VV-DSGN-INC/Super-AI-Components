"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChannelMessage, type Channel, type ChannelMessageData } from "@/registry/super-ai/channel-message";

const WEEKLY_REVIEW: ChannelMessageData = {
  kind: "ready",
  from: "Lifey",
  what: "Your Weekly Review is ready.",
  link: "lifeos://review/42",
  quiet: "Stop asking",
};

const CHANNELS: Channel[] = ["app", "push", "chat", "sms", "email", "phone"];

export default function ChannelMessageDemo() {
  const [locked, setLocked] = React.useState(true);
  return (
    <div className="@container flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch id="channel-message-locked" checked={locked} onCheckedChange={setLocked} />
        <Label htmlFor="channel-message-locked">Push is locked</Label>
      </div>
      <div className="grid w-full gap-6 @2xl:grid-cols-2">
        {CHANNELS.map((channel) => (
          <ChannelMessage
            key={channel}
            channel={channel}
            message={WEEKLY_REVIEW}
            state="sent"
            locked={locked}
          />
        ))}
      </div>
    </div>
  );
}
