"use client";

import * as React from "react";
import { Bell, CreditCard, Settings } from "lucide-react";

import { AccountMenu } from "@/registry/super-ai/account-menu";

export default function AccountMenuDemo() {
  const [theme, setTheme] = React.useState("system");
  const [background, setBackground] = React.useState("default");

  return (
    <AccountMenu
      user={{ name: "Ada Lovelace", email: "ada@example.com" }}
      theme={theme}
      onThemeChange={setTheme}
      background={background}
      onBackgroundChange={setBackground}
      items={[
        { label: "Settings", icon: <Settings aria-hidden />, shortcut: ["⌘", ","] },
        { label: "Billing", icon: <CreditCard aria-hidden /> },
        { label: "Notifications", icon: <Bell aria-hidden /> },
      ]}
      onSignOut={() => {}}
      signOutShortcut={["⇧", "⌘", "Q"]}
    />
  );
}
