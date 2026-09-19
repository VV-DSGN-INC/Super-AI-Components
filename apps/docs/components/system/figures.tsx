import * as React from "react";

import type { FigureId, SystemFacts } from "@/lib/system-page";

import { CiPipeline } from "./ci-pipeline";
import { ConsumerSurfaces } from "./consumer-surfaces";
import { HarnessParts } from "./harness-parts";
import { Loops } from "./loops";

export type FigureComponent = (props: { facts: SystemFacts }) => React.ReactElement;

/** The figure registry. A total Record: a FigureId with no component is a
 *  type error, not a runtime one. */
export const FIGURES: Record<FigureId, FigureComponent> = {
  "harness-parts": HarnessParts,
  "consumer-surfaces": ConsumerSurfaces,
  loops: Loops,
  "ci-pipeline": CiPipeline,
};
