import { describe, expect, it } from "vitest";

import { GLOSSARY } from "./glossary";
import { MESSAGES, messagesFor } from "./messages";
import { localeHref } from "./paths";
import { LOCALES } from "./types";

describe("MESSAGES", () => {
  it("defines every locale", () => {
    for (const locale of LOCALES) expect(MESSAGES[locale]).toBeDefined();
  });

  it("has the same key set in every locale", () => {
    const en = Object.keys(MESSAGES.en).sort();
    for (const locale of LOCALES) expect(Object.keys(MESSAGES[locale]).sort()).toEqual(en);
  });

  it("has no empty string in any locale", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(MESSAGES[locale])) {
        expect(value, `${locale}.${key}`).not.toBe("");
      }
    }
  });

  // A language switcher is conventionally written in the language it switches
  // TO, so it stays legible to someone who cannot read the current page. Those
  // two keys are therefore identical in both locales, on purpose.
  it("actually translates — ru differs from en on every key but the endonyms", () => {
    const ENDONYMS = new Set(["switchToEnglish", "switchToRussian"]);
    for (const key of Object.keys(MESSAGES.en) as (keyof typeof MESSAGES.en)[]) {
      if (ENDONYMS.has(key)) continue;
      expect(MESSAGES.ru[key], key).not.toBe(MESSAGES.en[key]);
    }
  });

  it("messagesFor returns the locale's dictionary", () => {
    expect(messagesFor("ru")).toBe(MESSAGES.ru);
  });
});

describe("GLOSSARY", () => {
  it("is non-empty and has no duplicate English terms", () => {
    expect(GLOSSARY.length).toBeGreaterThan(10);
    const terms = GLOSSARY.map((g) => g.en);
    expect(new Set(terms).size).toBe(terms.length);
  });
});

describe("localeHref", () => {
  it("leaves English paths unprefixed", () => {
    expect(localeHref("en", "/components/kbd")).toBe("/components/kbd");
    expect(localeHref("en", "/")).toBe("/");
  });

  it("prefixes Russian paths", () => {
    expect(localeHref("ru", "/components/kbd")).toBe("/ru/components/kbd");
  });

  it("maps the English root to /ru, not /ru/", () => {
    expect(localeHref("ru", "/")).toBe("/ru");
  });
});
