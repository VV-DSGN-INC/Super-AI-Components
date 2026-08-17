import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LanguageSwitcher } from "./language-switcher";

describe("LanguageSwitcher", () => {
  it("links to the mirrored Russian path from an English page", () => {
    render(<LanguageSwitcher locale="en" path="/components/kbd" />);
    expect(screen.getByRole("link", { name: "Русский" })).toHaveAttribute(
      "href",
      "/ru/components/kbd",
    );
  });

  it("links back to the unprefixed English path from a Russian page", () => {
    render(<LanguageSwitcher locale="ru" path="/components/kbd" />);
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute(
      "href",
      "/components/kbd",
    );
  });

  it("marks the Russian label lang=ru so it is not read in an English voice", () => {
    render(<LanguageSwitcher locale="en" path="/" />);
    expect(screen.getByRole("link", { name: "Русский" })).toHaveAttribute("lang", "ru");
  });

  it("carries hreflang on both links", () => {
    render(<LanguageSwitcher locale="en" path="/" />);
    expect(screen.getByRole("link", { name: "Русский" })).toHaveAttribute("hreflang", "ru");
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("hreflang", "en");
  });

  it("marks the current locale with aria-current", () => {
    render(<LanguageSwitcher locale="en" path="/" />);
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Русский" })).not.toHaveAttribute("aria-current");
  });

  it("names the group so it is not two loose links", () => {
    render(<LanguageSwitcher locale="en" path="/" />);
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });
});
