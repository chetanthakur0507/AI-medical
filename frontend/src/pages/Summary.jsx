"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import axios from "axios"
import { API_BASE } from "../shared/api"
import SummaryCard from "../shared/SummaryCard"

export default function Summary() {
  const [params] = useSearchParams()
  const docId = params.get("docId")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState(null)
  const [showProv, setShowProv] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (!docId) return
      setLoading(true)
      setError("")
      try {
        const res = await axios.post(`${API_BASE}/summarize`, { doc_id: docId })
        setData(res.data)
      } catch (err) {
        setError(err?.response?.data?.detail || "Failed to summarize.")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [docId])

  const patientProv = useMemo(() => data?.provenance?.patient || [], [data])
  const clinicianProv = useMemo(() => data?.provenance?.clinician || [], [data])

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-balance">Summaries</h2>
          <p className="text-neutral-600">Patient-friendly and clinician-focused views.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showProv} onChange={(e) => setShowProv(e.target.checked)} />
          View Provenance
        </label>
      </div>

      {loading && <div>Generating summaries...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SummaryCard
            title="Patient Summary"
            text={data.patient_summary}
            provenance={showProv ? patientProv : []}
            accent="accent"
          />
          <SummaryCard
            title="Clinician Summary"
            text={data.clinician_summary}
            provenance={showProv ? clinicianProv : []}
            accent="primary"
          />
        </div>
      )}

      {data?.disclaimer && (
        <div className="rounded border bg-white p-3 text-sm">
          <strong>Disclaimer:</strong> {data.disclaimer}
        </div>
      )}
    </section>
  )
}
