"use client"

import type React from "react"

import { useState } from "react"
import { generateSummaries } from "@/lib/summarizer"

type Props = {
  onSummarized: (v: {
    patient: string
    clinician: string
    patientGrade: number
    clinicianConcepts: string[]
    mapping: { summaryIdx: number; sourceIdxs: number[] }[]
    sourceSentences: string[]
  }) => void
}

export function SummarizerForm({ onSummarized }: Props) {
  const [q, setQ] = useState("")
  const [a, setA] = useState("")
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setNote(null)
    try {
      const res = await generateSummaries({ question: q, answer: a, modelFile })
      onSummarized(res)
      if (res && res["__adapter"] === "heuristic") {
        setNote("Using heuristic baseline (no neural model yet). Load your ONNX model to swap in neural inference.")
      }
    } catch (err: any) {
      setNote(err?.message ?? "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Question */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-800">Question</label>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Paste the patient's question or Q from the Q&A pair…"
          required
        />
      </div>

      {/* Answer */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-800">Answer</label>
        <textarea
          value={a}
          onChange={(e) => setA(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Paste the clinician or source answer text…"
          required
        />
      </div>

      {/* Model loader */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-800">Optional: Load ONNX model (runs locally)</label>
        <input
          type="file"
          accept=".onnx"
          onChange={(e) => setModelFile(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />
        <p className="text-xs text-gray-600">
          Provide your distilled/quantized encoder-decoder model exported to ONNX. No uploads—this stays in your
          browser.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? "Summarizing…" : "Summarize locally"}
        </button>
        {note && <span className="text-xs text-teal-700 bg-teal-100 rounded px-2 py-1">{note}</span>}
      </div>
    </form>
  )
}
