import { CritiquePanel, type CritiqueIteration } from "@/registry/super-ai/critique-panel";

const iterations: CritiqueIteration[] = [
  {
    draft: "Quantum computers will break all encryption soon.",
    critique: "Overstated. Distinguish symmetric vs asymmetric; cite Shor's algorithm and NIST PQC timelines.",
    verdict: "needs-work",
  },
  {
    draft: "Shor's algorithm threatens RSA and ECC; NIST PQC migration is underway, with symmetric crypto largely safe.",
    critique: "No further critiques found. The draft is accurate and balanced.",
    verdict: "approved",
  },
];

export default function CritiquePanelDemo() {
  return <CritiquePanel iterations={iterations} onAccept={() => {}} onIterate={() => {}} className="w-full max-w-lg" />;
}
