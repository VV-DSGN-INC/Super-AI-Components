import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon, MicIcon } from "lucide-react";

const meta: Meta<typeof PromptInput> = {
  title: "AI Elements/Prompt Input",
  component: PromptInput,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof PromptInput>;

export const Default: Story = {
  render: () => {
    const [model, setModel] = React.useState("gpt-4o");

    return (
      <div className="w-[560px]">
        <PromptInput
          onSubmit={(_message, event) => {
            event.preventDefault();
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea
              defaultValue="Make a 20-second marketing video for our analytics dashboard."
              placeholder="Describe the video you want…"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton>
                <GlobeIcon className="size-4" />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputButton>
                <MicIcon className="size-4" />
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => setModel(value as string)}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  <PromptInputSelectItem value="gpt-4o">
                    GPT-4o
                  </PromptInputSelectItem>
                  <PromptInputSelectItem value="claude-opus-4">
                    Claude Opus 4
                  </PromptInputSelectItem>
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </div>
    );
  },
};
