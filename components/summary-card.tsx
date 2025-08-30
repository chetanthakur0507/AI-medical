"use client"

import { useState } from "react"

export function SummaryCard({
  title,
  text,
  badgeText,
  variant,
}: {
  title: string
  text: string
  badgeText?: string
  variant: "patient" | "clinician"
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
      <header className="flex items-center justify-between">
        <h2 className="text-base md:text-lg font-semibold text-balance">{title}</h2>
        <span
          className={
            "text-xs rounded px-2 py-1 " +
            (variant === "patient" ? "bg-sky-100 text-sky-800" : "bg-gray-100 text-gray-800")
          }
        >
          {badgeText}
        </span>
      </header>
      <p className="mt-3 text-sm leading-relaxed text-pretty whitespace-pre-wrap">{text}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-600">
          ⚠ Disclaimer: This summary is for informational purposes only and should not replace professional medical
          advice. Consult a licensed clinician.
        </p>
        <button
          onClick={copy}
          className="ml-4 shrink-0 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
          aria-label="Copy summary"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </article>
  )
}
