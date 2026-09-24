"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { DocsNav } from "@/components/docs-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** The sidebar under `md`, as a drawer. Closes on `onNavigate` from the list
 *  rather than on a pathname effect, so no state is set inside an effect. */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <header
      data-slot="mobile-nav"
      className="bg-background sticky top-0 z-40 flex items-center gap-2 border-b px-4 py-2 md:hidden"
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button type="button" variant="ghost" size="icon" aria-label="Open navigation" />}
        >
          <MenuIcon />
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle>Components</SheetTitle>
            <SheetDescription className="sr-only">Every catalog and marketing item</SheetDescription>
          </SheetHeader>
          <DocsNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Link href="/" className="text-sm font-semibold">
        Super-AI-Components
      </Link>
      <ThemeToggle className="ms-auto" />
    </header>
  );
}
