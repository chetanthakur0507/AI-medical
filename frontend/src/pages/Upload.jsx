"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE } from "../shared/api"

export default function Upload() {
  const [mode, setMode] = useState("pdf")
  const [file, setFile] = useState(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const form = new FormData()
      if (mode === "pdf" && file) {
        form.append("file", file)
      } else if (mode === "text" && text.trim()) {
        form.append("text", text.trim())
      } else {
        setError("Please provide a PDF or some text.")
        setLoading(false)
        return
      }
      const res = await axios.post(`${API_BASE}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const docId = res.data.doc_id
      navigate(`/summary?docId=${encodeURIComponent(docId)}`)
    } catch (err) {
      setError(err?.response?.data?.detail || "Upload failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-balance">Upload Document</h2>
        <p className="text-neutral-600">Upload a PDF or paste text to generate patient and clinician summaries.</p>
      </div>

      <div className="inline-flex rounded-md border bg-white p-1">
        <button
          className={`px-3 py-1 text-sm rounded ${mode === "pdf" ? "bg-primary text-white" : "hover:bg-neutral-50"}`}
          onClick={() => setMode("pdf")}
          type="button"
          aria-pressed={mode === "pdf"}
        >
          PDF
        </button>
        <button
          className={`px-3 py-1 text-sm rounded ${mode === "text" ? "bg-primary text-white" : "hover:bg-neutral-50"}`}
          onClick={() => setMode("text")}
          type="button"
          aria-pressed={mode === "text"}
        >
          Text
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "pdf" ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Select PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Paste Text</label>
            <textarea
              className="w-full min-h-[160px] rounded border p-2 text-sm"
              placeholder="Paste clinical notes or report text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Continue"}
        </button>
      </form>

      <div className="text-sm text-neutral-600">
        Tip: Try the sample PDFs in <code className="bg-neutral-100 px-1 rounded">/data/samples</code>.
      </div>
    </section>
  )
}
