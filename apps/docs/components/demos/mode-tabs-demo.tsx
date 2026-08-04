"use client";
import { useState } from "react";
import { MessageSquare, PenLine, Sparkles, Users } from "lucide-react";

import { ModeTabs } from "@/registry/super-ai/mode-tabs";

const CHAT_MODES = [
  { value: "chat", label: "Chat" },
  { value: "cowork", label: "Cowork" },
];

const DESIGN_MODES = [
  { value: "ask", label: "Ask", icon: <MessageSquare /> },
  { value: "design", label: "Design", icon: <PenLine /> },
  { value: "build", label: "Build", icon: <Sparkles /> },
];

const COMPACT_MODES = [
  { value: "chat", label: "Chat", icon: <MessageSquare /> },
  { value: "cowork", label: "Cowork", icon: <Users /> },
];

export default function ModeTabsDemo() {
  const [chatMode, setChatMode] = useState("chat");
  const [designMode, setDesignMode] = useState("design");
  const [compactMode, setCompactMode] = useState("chat");

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Default — text-only</p>
        <ModeTabs modes={CHAT_MODES} value={chatMode} onValueChange={setChatMode} />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">With icon — icon + visible label</p>
        <ModeTabs modes={DESIGN_MODES} variant="with-icon" value={designMode} onValueChange={setDesignMode} />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">With tooltip — icon-only, compact</p>
        <ModeTabs modes={COMPACT_MODES} variant="with-tooltip" value={compactMode} onValueChange={setCompactMode} />
      </div>
    </div>
  );
}
