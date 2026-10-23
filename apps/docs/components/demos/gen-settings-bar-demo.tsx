"use client";
import { useState } from "react";

import {
  GenSettingsBar,
  GenSettingsItem,
  GenSettingsQuality,
  type GenQuality,
} from "@/registry/super-ai/gen-settings-bar";

export default function GenSettingsBarDemo() {
  const [quality, setQuality] = useState<GenQuality>("final");
  return (
    <GenSettingsBar aria-label="Generation settings">
      <GenSettingsItem>Veo 3.1 Fast</GenSettingsItem>
      <GenSettingsItem>16:9</GenSettingsItem>
      <GenSettingsItem>720p</GenSettingsItem>
      <GenSettingsItem>4s</GenSettingsItem>
      <GenSettingsItem>×3</GenSettingsItem>
      <GenSettingsQuality quality={quality} onQualityChange={setQuality} />
    </GenSettingsBar>
  );
}
