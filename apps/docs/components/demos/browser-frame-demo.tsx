"use client";

import { BrowserFrame } from "@/registry/super-ai/browser-frame";

export default function BrowserFrameDemo() {
  return (
    <div className="w-full max-w-xl">
      <BrowserFrame address="https://vercel.com/geist/browser">
        <div className="flex size-full items-center justify-center bg-muted text-sm text-foreground">
          Captured page
        </div>
      </BrowserFrame>
    </div>
  );
}
