import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const meta: Meta<typeof Field> = {
  title: "shadcn/ui/Field",
  component: Field,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <FieldGroup className="w-96">
      <Field>
        <FieldLabel htmlFor="prompt">Prompt</FieldLabel>
        <Input id="prompt" defaultValue="cyberpunk alley at night, neon rain" />
        <FieldDescription>
          Describe the image you want Aurora-XL to generate.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="seed">Seed</FieldLabel>
        <Input id="seed" placeholder="Random" />
        <FieldDescription>Leave empty for a random seed.</FieldDescription>
      </Field>
    </FieldGroup>
  ),
};

export const WithError: Story = {
  render: () => (
    <FieldGroup className="w-96">
      <Field data-invalid>
        <FieldLabel htmlFor="steps">Sampling steps</FieldLabel>
        <Input id="steps" defaultValue="500" aria-invalid />
        <FieldError>Steps must be between 1 and 150.</FieldError>
      </Field>
    </FieldGroup>
  ),
};

export const FieldSetExample: Story = {
  render: () => (
    <FieldSet className="w-96">
      <FieldLegend>Output options</FieldLegend>
      <FieldDescription>Choose what to include in your export.</FieldDescription>
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox id="meta" defaultChecked />
          <FieldContent>
            <FieldTitle>Embed metadata</FieldTitle>
            <FieldDescription>Store the prompt and seed in the file.</FieldDescription>
          </FieldContent>
        </Field>
        <FieldSeparator />
        <Field orientation="horizontal">
          <Checkbox id="upscale" />
          <FieldContent>
            <FieldTitle>Auto-upscale to 4K</FieldTitle>
            <FieldDescription>Adds 2 credits per render.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};
