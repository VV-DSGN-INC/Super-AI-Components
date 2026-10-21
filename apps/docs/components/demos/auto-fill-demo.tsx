"use client";

import * as React from "react";

import {
  AutoFill,
  AutoFillCell,
  type AutoFillCellStatus,
  type AutoFillRecord,
  type AutoFillSample,
} from "@/registry/super-ai/auto-fill";

const FIELDS = [
  { id: "industry", label: "Industry" },
  { id: "size", label: "Company size" },
];

const RECORDS: AutoFillRecord[] = [
  { id: "r1", label: "Northwind Traders", current: null },
  { id: "r2", label: "Fabrikam", current: "Manufacturing" },
  { id: "r3", label: "Contoso", current: null },
  { id: "r4", label: "Tailspin Toys", current: "Retail" },
];

const SAMPLES: AutoFillSample[] = [
  { id: "r1", value: "Wholesale", reason: "Imports and resells goods.", cost: 2, durationMs: 1240 },
  { id: "r2", value: "Industrial manufacturing", cost: 2, durationMs: 980 },
  { id: "r3", value: "Software", reason: "Sells licences for a desktop suite.", cost: 2, durationMs: 1100 },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function AutoFillDemo() {
  const [cells, setCells] = React.useState<
    Record<
      string,
      { status: AutoFillCellStatus | "human"; value: string; reason?: string; previous?: string }
    >
  >(() =>
    Object.fromEntries(RECORDS.map((r) => [r.id, { status: "human" as const, value: r.current ?? "" }])),
  );
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  const apply = async (_prompt: string, overwrite: boolean) => {
    const targets = RECORDS.filter((r) => overwrite || !r.current);
    setProgress({ done: 0, total: targets.length });
    for (const [i, record] of targets.entries()) {
      await wait(300);
      const sample = SAMPLES.find((s) => s.id === record.id) ?? {
        id: record.id,
        value: "Retail",
        reason: "Sells to shoppers.",
      };
      setCells((all) => ({
        ...all,
        [record.id]: {
          status: "suggested",
          value: sample.value,
          reason: sample.reason,
          previous: record.current ?? undefined,
        },
      }));
      setProgress({ done: i + 1, total: targets.length });
    }
  };

  return (
    <table className="w-full max-w-xl text-left text-sm">
      <thead>
        <tr>
          <th className="py-1 pr-4 font-medium">Company</th>
          <th className="py-1 font-medium">
            <span className="flex items-center gap-1">
              Industry
              <AutoFill
                fields={FIELDS}
                defaultField="industry"
                records={RECORDS.map((r) => ({
                  ...r,
                  current: cells[r.id]?.status === "human" ? cells[r.id].value : r.current,
                }))}
                onSample={async () => {
                  await wait(500);
                  return SAMPLES;
                }}
                onApply={apply}
                progress={progress}
              />
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {RECORDS.map((record) => {
          const cell = cells[record.id];
          return (
            <tr key={record.id} className="border-t align-top">
              <td className="py-2 pr-4">{record.label}</td>
              <td className="py-2">
                {cell.status === "human" ? (
                  cell.value || "Empty"
                ) : (
                  <AutoFillCell
                    status={cell.status}
                    value={cell.value}
                    previous={cell.previous}
                    reason={cell.reason}
                    label={`${record.label}, Industry`}
                    onAccept={() =>
                      setCells((all) => ({ ...all, [record.id]: { ...cell, status: "accepted" } }))
                    }
                    onOverride={(value, reason) =>
                      setCells((all) => ({ ...all, [record.id]: { status: "overridden", value, reason } }))
                    }
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
