import { RainbowButton } from "@/registry/marketing/rainbow-button";
export default function RainbowButtonDemo() {
  return (
    <div className="flex items-center gap-4">
      <RainbowButton>Get unlimited access</RainbowButton>
      <RainbowButton variant="outline" size="sm">
        View pricing
      </RainbowButton>
    </div>
  );
}
