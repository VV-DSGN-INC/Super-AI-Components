import type { Metadata } from "next";

import { FlowDemo } from "./flow-demo";

export const metadata: Metadata = {
  title: "Flow Kit — image → video chain",
  description:
    "Wave 2 acceptance demo: two image nodes feeding a video node, executed by useFlowRunner on a stub executor with content-hash caching, branch-local failure, and abortable runs.",
};

export default function FlowPage() {
  return <FlowDemo />;
}
