import { NumberTicker } from "@/components/marketing/number-ticker";

export default function NumberTickerDemo() {
  return (
    <div className="flex gap-10 text-center">
      <div>
        <p className="text-4xl font-bold">
          <NumberTicker value={12400} />+
        </p>
        <p className="text-muted-foreground mt-1 text-sm">deploys/day</p>
      </div>
      <div>
        <p className="text-4xl font-bold">
          <NumberTicker value={99.98} decimalPlaces={2} />%
        </p>
        <p className="text-muted-foreground mt-1 text-sm">uptime</p>
      </div>
      <div>
        <p className="text-4xl font-bold">
          <NumberTicker value={38} />
          ms
        </p>
        <p className="text-muted-foreground mt-1 text-sm">p99 latency</p>
      </div>
    </div>
  );
}
