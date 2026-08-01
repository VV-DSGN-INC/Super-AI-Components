import { Marquee } from "@/registry/marketing/marquee";

const brands = ["Acme", "Northwind", "Umbrella", "Initech", "Globex", "Hooli"];

export default function MarqueeDemo() {
  return (
    <div className="w-full max-w-xl">
      <Marquee pauseOnHover duration={30}>
        {brands.map((brand) => (
          <span
            key={brand}
            className="text-muted-foreground flex items-center gap-2 text-lg font-semibold"
          >
            <span className="bg-muted size-6 rounded-md" aria-hidden="true" />
            {brand}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
