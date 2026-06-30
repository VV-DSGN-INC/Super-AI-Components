import * as React from "react";

// Minimal next/image stand-in for Storybook (Vite) — renders a plain <img>.
type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

export default function Image({ fill, priority, unoptimized, style, alt = "", ...props }: NextImageProps) {
  const fillStyle: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : {};
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} style={{ ...fillStyle, ...style }} {...props} />;
}
