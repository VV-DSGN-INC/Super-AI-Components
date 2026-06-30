import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
} from "@/components/ui/combobox";

const meta: Meta<typeof Combobox> = {
  title: "shadcn/ui/Combobox",
  component: Combobox,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const models = [
  "Aurora-XL",
  "Aurora-XL 2.0",
  "Sketch-v3",
  "Lumen-Turbo",
  "Photon-Realism",
  "Inkwell-Anime",
  "Voxel-3D",
];

export const Default: Story = {
  render: () => (
    <Combobox items={models} defaultValue="Aurora-XL 2.0">
      <ComboboxInput placeholder="Select a model" className="w-64" />
      <ComboboxContent>
        <ComboboxEmpty>No model found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const Grouped: Story = {
  render: () => (
    <Combobox items={models}>
      <ComboboxInput placeholder="Search models" className="w-64" showClear />
      <ComboboxContent>
        <ComboboxEmpty>No model found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxGroup>
            <ComboboxLabel>Image models</ComboboxLabel>
            <ComboboxItem value="Aurora-XL">Aurora-XL</ComboboxItem>
            <ComboboxItem value="Aurora-XL 2.0">Aurora-XL 2.0</ComboboxItem>
            <ComboboxItem value="Photon-Realism">Photon-Realism</ComboboxItem>
          </ComboboxGroup>
          <ComboboxGroup>
            <ComboboxLabel>Fast / draft</ComboboxLabel>
            <ComboboxItem value="Sketch-v3">Sketch-v3</ComboboxItem>
            <ComboboxItem value="Lumen-Turbo">Lumen-Turbo</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

const styles = ["Cinematic", "Anime", "Watercolor", "3D Render", "Cyberpunk", "Photoreal"];

export const MultiSelectChips: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([
      "Cinematic",
      "Cyberpunk",
    ]);
    return (
      <Combobox<string, true>
        items={styles}
        multiple
        value={selected}
        onValueChange={setSelected}
      >
        <ComboboxChips className="w-72">
          {selected.map((style) => (
            <ComboboxChip key={style}>{style}</ComboboxChip>
          ))}
          <ComboboxChipsInput placeholder="Add style tags" />
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxEmpty>No style found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};
