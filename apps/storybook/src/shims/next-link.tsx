import * as React from "react";

// Minimal next/link stand-in for Storybook (Vite) — renders a plain <a>.
type NextLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string | { pathname?: string };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, prefetch, replace, scroll, children, ...props },
  ref,
) {
  const resolvedHref = typeof href === "string" ? href : (href?.pathname ?? "#");
  return (
    <a ref={ref} href={resolvedHref} {...props}>
      {children}
    </a>
  );
});

export default Link;
