import { describe, expect, it } from "vitest";

import type { ComponentDocs } from "@/lib/component-docs";
import type { DocsTranslation } from "@/lib/i18n/types";
import { localizeDocs } from "@/lib/i18n/localize-docs";

const EN: ComponentDocs = {
  whatItIs: "The nothing-here surface.",
  whyItMatters: "Empty is the default view.",
  evidence: ["NotebookLM"],
  anatomy: [
    { slot: "empty-state", note: "Root." },
    { slot: "empty-state-header", note: "Groups the mark and title." },
  ],
  usage: "Reach for it when a surface can have nothing in it.",
  dos: [{ text: "Match the CTA verb to the surface.", example: <span>ok</span> }],
  donts: [{ text: "Don't ship one generic CTA." }],
  accessibility: {
    keyboard: ["Zero tab stops of its own."],
    screenReader: ["The title renders as a div."],
    focus: ["This component never moves focus."],
  },
  pitfalls: ["Copying one empty state across surfaces."],
};

const RU: DocsTranslation = {
  whatItIs: "Поверхность пустого состояния.",
  whyItMatters: "Пустое состояние — это вид по умолчанию.",
  usage: "Используйте, когда поверхность может быть пустой.",
  anatomy: {
    "empty-state": "Корень.",
    "empty-state-header": "Группирует знак и заголовок.",
  },
  dos: ["Сопоставьте глагол действия с поверхностью."],
  donts: ["Не используйте один универсальный призыв к действию."],
  accessibility: {
    keyboard: ["Не имеет собственных точек табуляции."],
    screenReader: ["Заголовок рендерится как div."],
    focus: ["Этот компонент не перемещает фокус."],
  },
  pitfalls: ["Копирование одного пустого состояния на все поверхности."],
};

describe("localizeDocs", () => {
  it("returns the English object untouched when there is no translation", () => {
    expect(localizeDocs(EN, undefined)).toBe(EN);
  });

  it("overlays translated prose", () => {
    const out = localizeDocs(EN, RU);
    expect(out.whatItIs).toBe("Поверхность пустого состояния.");
    expect(out.usage).toBe("Используйте, когда поверхность может быть пустой.");
    expect(out.pitfalls).toEqual(["Копирование одного пустого состояния на все поверхности."]);
  });

  it("never translates slot names — they are data-slot attribute values", () => {
    const out = localizeDocs(EN, RU);
    expect(out.anatomy.map((a) => a.slot)).toEqual(["empty-state", "empty-state-header"]);
    expect(out.anatomy[1].note).toBe("Группирует знак и заголовок.");
  });

  it("never translates evidence — those are product names", () => {
    expect(localizeDocs(EN, RU).evidence).toEqual(["NotebookLM"]);
  });

  it("keeps the English example nodes", () => {
    const out = localizeDocs(EN, RU);
    expect(out.dos[0].example).toBe(EN.dos[0].example);
    expect(out.dos[0].text).toBe("Сопоставьте глагол действия с поверхностью.");
  });

  it("falls back per field when the translation is short or partial", () => {
    const partial = { ...RU, dos: [], pitfalls: [] } as DocsTranslation;
    const out = localizeDocs(EN, partial);
    expect(out.dos[0].text).toBe("Match the CTA verb to the surface.");
    expect(out.pitfalls).toEqual(["Copying one empty state across surfaces."]);
  });

  it("keeps an English anatomy note when the translation omits that slot", () => {
    const partial = { ...RU, anatomy: { "empty-state": "Корень." } } as DocsTranslation;
    expect(localizeDocs(EN, partial).anatomy[1].note).toBe("Groups the mark and title.");
  });
});
