"use client"

import { useMemo, useState } from "react"

export function ProvenanceView({
  summary,
  mapping,
  sourceSentences,
}: {
  summary: string
  mapping: { summaryIdx: number; sourceIdxs: number[] }[]
  sourceSentences: string[]
}) {
  const sumSentences = useMemo(() => splitIntoSentences(summary), [summary])
  const [activeSummaryIdx, setActiveSummaryIdx] = useState<number | null>(null)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
      <header className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold">Provenance</h3>
        <p className="text-xs text-gray-600">Click a summary sentence to highlight source</p>
      </header>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-2">Summary</h4>
          <ul className="space-y-2">
            {sumSentences.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => setActiveSummaryIdx((prev) => (prev === i ? null : i))}
                  className={
                    "text-left w-full rounded border px-3 py-2 text-sm leading-relaxed " +
                    (activeSummaryIdx === i ? "border-sky-400 bg-sky-50" : "border-gray-200 hover:bg-gray-50")
                  }
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-2">Source Sentences</h4>
          <ul className="space-y-2">
            {sourceSentences.map((s, i) => {
              const isHighlighted =
                activeSummaryIdx != null &&
                mapping.find((m) => m.summaryIdx === activeSummaryIdx)?.sourceIdxs.includes(i)
              return (
                <li
                  key={i}
                  className={
                    "rounded border px-3 py-2 text-sm leading-relaxed " +
                    (isHighlighted ? "border-teal-500 bg-teal-50" : "border-gray-200")
                  }
                >
                  {s}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

function splitIntoSentences(text: string) {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.?!])\s+/))
    .map((s) => s.trim())
    .filter(Boolean)
}
