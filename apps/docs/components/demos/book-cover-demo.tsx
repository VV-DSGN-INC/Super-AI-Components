"use client";

import { BookCover } from "@/registry/super-ai/book-cover";

export default function BookCoverDemo() {
  return (
    <div className="flex w-full max-w-md items-start gap-4">
      <BookCover title="Brand guidelines" variant="stripe" width={128} />
      <BookCover title="API reference" tone="ink" width={128} />
      <BookCover title="Onboarding templates" tone="muted" textured width={128} />
    </div>
  );
}
