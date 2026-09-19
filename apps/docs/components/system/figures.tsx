import * as React from "react";

import type { FigureId, SystemFacts } from "@/lib/system-page";

import { HarnessParts } from "./harness-parts";

export type FigureComponent = (props: { facts: SystemFacts }) => React.ReactElement;

/** The figure registry. Partial until Task 9 builds the other three, after
 *  which the type becomes a total Record and a missing figure is a type error. */
export const FIGURES: Partial<Record<FigureId, FigureComponent>> = {
  "harness-parts": HarnessParts,
};
