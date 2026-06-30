import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  Image,
  Library,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "shadcn/ui/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

const nav = [
  { title: "Chat", icon: MessageSquare, badge: "3", active: true },
  { title: "Image Studio", icon: Image, badge: undefined, active: false },
  { title: "Library", icon: Library, badge: "128", active: false },
  { title: "Settings", icon: Settings, badge: undefined, active: false },
];

const recents = ["Logo concepts", "Landing hero copy", "Product photoshoot"];

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-1 py-1.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none">
                  Nova Studio
                </span>
                <span className="text-xs text-muted-foreground">Pro plan</span>
              </div>
            </div>
            <SidebarInput placeholder="Search prompts…" />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={item.active}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {recents.map((title) => (
                    <SidebarMenuItem key={title}>
                      <SidebarMenuButton tooltip={title}>
                        <Search />
                        <span>{title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="New chat">
                  <Plus />
                  <span>New chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">Chat</span>
            <span className="ml-auto text-xs text-muted-foreground">
              1,240 credits
            </span>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-6">
            <div className="rounded-lg border bg-card p-4 text-sm text-card-foreground">
              <p className="font-medium">Nova</p>
              <p className="mt-1 text-muted-foreground">
                Hi! Describe an image and I&apos;ll generate a few options for
                you.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-sm text-card-foreground">
              <p className="font-medium">You</p>
              <p className="mt-1 text-muted-foreground">
                A neon-lit cyberpunk alley in the rain, cinematic lighting.
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  ),
};

export const Collapsible: Story = {
  render: () => {
    function CollapsibleSidebar() {
      const [open, setOpen] = React.useState(true);
      return (
        <TooltipProvider>
          <SidebarProvider open={open} onOpenChange={setOpen}>
            <Sidebar collapsible="icon">
              <SidebarHeader>
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Sparkles className="size-4" />
                  </div>
                  <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
                    Nova Studio
                  </span>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {nav.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            isActive={item.active}
                            tooltip={item.title}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              <header className="flex h-12 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <span className="text-sm font-medium">
                  Toggle the icon-collapsible sidebar
                </span>
              </header>
              <div className="p-6 text-sm text-muted-foreground">
                Use the trigger (or Cmd/Ctrl + B) to collapse the sidebar to
                icons.
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      );
    }
    return <CollapsibleSidebar />;
  },
};
