# Records board analysis — second reference population, slice 2

**Scope:** Project-management and structured-records products — the category that governs how a
user chooses *how they browse* a collection and *how a record opens*.
**Read:** 2026-08-11.
**Status:** Actions the family P candidates only. Provisional — see §1.

---

## 1. Method — and how it differs from both earlier reads

The [primary board](reference-board-analysis.md) was read through the Figma MCP server, section by
section, off a curated board of product screenshots. The [agent slice](agent-board-analysis.md)
was not, and said so. **This slice is not either, and the gap is wider.**

| | Primary board | Agent slice | This slice |
| --- | --- | --- | --- |
| Source | Curated Figma board | Product docs + hands-on familiarity | Public product documentation only |
| Screens seen | Every one | Some | **None** |
| Claims verifiable by | Re-reading the board | Re-reading the cited docs | Re-reading the cited docs |

Every claim below carries a source URL and was read, not recalled. But no screen was examined, so
this slice can establish **that** a pattern exists and **what** its options are, and cannot
establish how it is drawn. Anatomy claims — where a control sits, what it looks like collapsed,
how it degrades on mobile — are outside what this method can support, and none are made.

**Consequence for D18, stated up front:** family P is justified to build, and is not on the same
evidentiary footing as families A–O. Verifying these seven products against real screens is open
work, recorded in [`CONTINUE.md`](../CONTINUE.md) §3.1.

## 2. Products observed

Seven products, none represented on the primary board or the agent slice. Chosen because records
are the *subject* of the product rather than a by-product of it.

| Product | Category |
| --- | --- |
| Linear | Issue tracking |
| Notion | Structured documents / databases |
| Asana | Work management |
| Airtable | Relational records |
| Monday | Work management |
| ClickUp | Work management |
| Height | Issue tracking |

Asana, Monday and ClickUp are not mutually unrelated in the sense D1 intends — they are three
entrants in one category. **They are counted as one product for inclusion purposes.** That leaves
five independent data points: Linear, Notion, Airtable, Height, and the work-management category.

## 3. The load-bearing finding

The two axes are real, and one product implements them exactly as the family P candidates model
them.

**Notion carries a per-view Layout setting and a separate per-view "Open pages in" setting.** The
latter offers three options — side peek (opens at the right, the collection stays interactive),
center peek (a focused modal over the collection), and full page. Its defaults are *derived from*
the layout (table, board, list and timeline default to side peek; gallery and calendar default to
center peek) but the setting is independently changeable, and Notion states that each view holds
its own settings rather than sharing them.

Those three options map onto the record axis one-for-one:

| Notion | Family P `DetailMode` |
| --- | --- |
| Side peek | `overlay` — Sheet, collection still live at left |
| Center peek | `popup` — Dialog, centred over a dimmed collection |
| Full page | `fullscreen` — fills the route, owns a URL |

This is the single most important result in the slice, because axis independence was the claim most
likely to fail. It did not fail; it was found already shipped, under different names, in the
product with the most mature version of the pattern.

**A correction the slice forces:** Notion's per-layout *defaults* are a real behaviour the family P
candidates do not have. `useDetailMode` keys by entity and has one fallback. Notion keys by view
and derives the fallback from the layout. That is a genuine gap, and §5 records it rather than
quietly adopting it.

## 4. Inclusion test re-run

### Passes

**A user-selectable multi-view switch over one collection — 7 of 7 products.**

| Product | Views offered | Source |
| --- | --- | --- |
| Linear | list · board; timeline on projects | [display-options](https://linear.app/docs/display-options), [board-layout](https://linear.app/docs/board-layout), [timeline](https://linear.app/docs/timeline) |
| Notion | table · board · timeline · calendar · list · gallery · chart | [views-filters-and-sorts](https://www.notion.com/help/views-filters-and-sorts) |
| Asana | list · board · calendar · timeline | [project-views](https://asana.com/features/project-management/project-views) |
| Airtable | grid · kanban · calendar · timeline · gallery · gantt | [view types](https://support.airtable.com/hc/en-us/articles/360021502314-Getting-started-view-types) |
| Monday | kanban · calendar · gantt · timeline · table | [board views](https://support.monday.com/hc/en-us/articles/360001267945-The-board-views) |
| ClickUp | list · board · calendar · gantt · table | [intro to views](https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views) |
| Height | spreadsheet · kanban · calendar · gantt | [visualizations](https://help.height.app/en/collections/3241734-visualizations) |

Five independent data points against a bar of three. **P1 `data-views` clears D1.**

**A record-open mode configured separately from the collection view — 3 of 5 independent points.**

| Product | Evidence | Source |
| --- | --- | --- |
| Notion | "Open pages in" — side peek · center peek · full page, set per view alongside but separately from Layout | [views-filters-and-sorts](https://www.notion.com/help/views-filters-and-sorts) |
| ClickUp | Task layouts — modal vs sidebar, switched from the open task; the choice carries to the next task opened | [task-layouts](https://help.clickup.com/hc/en-us/articles/29665520762647-Task-layouts) |
| Airtable | Record-detail configured per element (grid, kanban, timeline), independent of the element's own layout | [interface-element-grid](https://support.airtable.com/docs/interface-element-grid) |

**P2 `detail-view-shell` clears D1**, at exactly three. This is the narrowest pass in the slice and
should be the first thing re-tested when the screens are verified.

**Persistence of the collection choice — 3 of 5.** Notion holds settings per view; Asana saves a
default view per project ([filter-and-save-views](https://academy.asana.com/filter-and-save-views/591460));
Monday persists each added view as its own tab on the board. The scope is consistently **per
section**, not per user and not global — which is the scope `useViewMode(section)` already uses.

### Fails or defers

**Calendar and timeline as peers rather than destinations — mixed, and it does not matter.** Notion,
Airtable, ClickUp and Height place them in the same switcher as list and board. Linear does not:
timeline is projects-only and deliberately separated from issue views. The family P design already
accommodates both, because `TimeCapability` is optional — a section without `getDateRange` never
offers the time views. No change needed, but the split is real and worth knowing.

**A `view-switcher` as a standalone item — deferred.** Every product has one, but this slice saw no
screens, so nothing can be said about its anatomy. It stays folded into P1 rather than promoted on
evidence that cannot support it.

**Per-layout defaults for the record axis — deferred to §5.**

## 5. What the slice corrects about the family P candidates

**One gap, recorded not adopted.** `useDetailMode(entity)` takes a single fallback. Notion derives
the record-open default from the collection layout, so switching a view to calendar changes how its
records open unless the user has overridden it. One product is not three, so this does not become a
requirement — but the shape of the fix is known if a second product is later found to do it: the
fallback becomes a function of the current `ViewMode` rather than a constant.

**One assumption confirmed.** The collection preference is stored per section in every product that
persists it at all. No product was found storing one global view preference across sections, which
is the design `useViewMode` would have been wrong about.

**One naming mismatch worth noting.** The candidates call the modes `popup`, `overlay`,
`fullscreen`. The category's vocabulary is closer to Notion's — peek, side peek, full page. Not
changed, because the existing names are already shipped in the source implementation and its
tests, and renaming on documentation evidence alone is churn.

## 6. What this slice does not cover

- **No screens.** Every anatomy question — control placement, collapsed forms, mobile degradation,
  empty and loading states — is unanswered and unanswerable by this method.
- **Only two candidates tested.** The slice was run to justify P1 and P2, not to derive a family.
  Other records-shaped patterns in these products (saved filters, grouping controls, swimlanes,
  dependency arrows) were seen in passing and not evaluated.
- **No AI products.** This is deliberate — the gap being filled is precisely that the primary board
  and agent slice sample AI tools, where this pattern does not appear.
- **The three work-management products were collapsed to one data point.** If the category is later
  judged to contain genuinely unrelated products, the counts in §4 rise and the P2 result stops
  being marginal.

## Sources

- Linear — [display options](https://linear.app/docs/display-options) · [board layout](https://linear.app/docs/board-layout) · [timeline](https://linear.app/docs/timeline) · [custom views](https://linear.app/docs/custom-views)
- Notion — [database views, filters, sorts & groups](https://www.notion.com/help/views-filters-and-sorts) · [boards](https://www.notion.com/help/boards) · [timelines](https://www.notion.com/help/timelines)
- Asana — [project views](https://asana.com/features/project-management/project-views) · [filter and save views](https://academy.asana.com/filter-and-save-views/591460)
- Airtable — [view types](https://support.airtable.com/hc/en-us/articles/360021502314-Getting-started-view-types) · [interface element: grid](https://support.airtable.com/docs/interface-element-grid) · [timeline view](https://support.airtable.com/v1/docs/timeline-view-overview)
- Monday — [the board views](https://support.monday.com/hc/en-us/articles/360001267945-The-board-views) · [the Kanban view](https://support.monday.com/hc/en-us/articles/360000661379-The-Kanban-View)
- ClickUp — [intro to views](https://help.clickup.com/hc/en-us/articles/6329880717719-Intro-to-views) · [task layouts](https://help.clickup.com/hc/en-us/articles/29665520762647-Task-layouts)
- Height — [visualizations](https://help.height.app/en/collections/3241734-visualizations) · [kanban](https://height.app/product/kanban) · [spreadsheets](https://height.app/product/spreadsheet)
