import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/react-vite";
import preview from "./preview";

const project = setProjectAnnotations([a11yAddonAnnotations, preview]);
beforeAll(project.beforeAll);
