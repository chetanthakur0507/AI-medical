




"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import gsap from "gsap"
import { SummarizerForm } from "@/components/summarizer-form"
import { SummaryCard } from "@/components/summary-card"
import { ProvenanceView } from "@/components/provenance-view"

export default function Page() {
  const [results, setResults] = useState<null | {
    patient: string
    clinician: string
    patientGrade: number
    clinicianConcepts: string[]
    mapping: { summaryIdx: number; sourceIdxs: number[] }[]
    sourceSentences: string[]
  }>(null)

  const headerRef = useRef(null)
  const footerRef = useRef(null)

  // GSAP animations for header/footer
  useEffect(() => {
    gsap.from(headerRef.current, {
      y: -80,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    })
    gsap.from(footerRef.current, {
      y: 80,
      opacity: 0,
      duration: 1,
      delay: 0.5,
      ease: "power3.out",
    })
  }, [])

  return (
    <main className="min-h-dvh bg-gradient-to-br from-gray-900 via-black to-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header
        ref={headerRef}
        className="border-b border-gray-800 bg-gradient-to-r from-sky-600/20 to-purple-600/20 backdrop-blur-md"
      >
        <div className="mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
            Perspective-Aware Medical Summarizer
          </h1>
          <span className="inline-flex items-center rounded-lg bg-sky-500/10 text-sky-400 px-3 py-1 text-xs font-semibold shadow-md">
            🚀 Local · No APIs
          </span>
        </div>
      </header>

      {/* Summarizer Form */}
      <motion.section
        className="mx-auto max-w-4xl px-4 py-8 md:py-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-gray-800 shadow-lg">
          <SummarizerForm onSummarized={setResults} />
        </div>
      </motion.section>

      {/* Results */}
      {results && (
        <motion.section
          className="mx-auto max-w-5xl px-4 pb-16 space-y-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-gray-800 shadow-xl"
            >
              <SummaryCard
                title="🩺 Patient-Friendly Summary"
                variant="patient"
                text={results.patient}
                badgeText={`Readability: Grade ${results.patientGrade.toFixed(1)}`}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-gray-800 shadow-xl"
            >
              <SummaryCard
                title="⚕️ Clinician-Focused Summary"
                variant="clinician"
                text={results.clinician}
                badgeText={
                  results.clinicianConcepts.length
                    ? `Concepts: ${results.clinicianConcepts.slice(0, 6).join(", ")}${
                        results.clinicianConcepts.length > 6 ? "…" : ""
                      }`
                    : "Concepts: —"
                }
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-gray-800 shadow-xl p-6"
          >
            <ProvenanceView
              summary={results.patient + "\n" + results.clinician}
              mapping={results.mapping}
              sourceSentences={results.sourceSentences}
            />
          </motion.div>

          <motion.p
            className="text-sm text-gray-400 text-center italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            ⚠ Disclaimer: This summary is for informational purposes only and should not replace professional medical
            advice. Always consult a licensed clinician.
          </motion.p>
        </motion.section>
      )}

      {/* Footer */}
      <footer
        ref={footerRef}
        className="mt-auto border-t border-gray-800 bg-gradient-to-r from-sky-600/10 to-purple-600/10"
      >
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-400 text-center">
          Built to run fully in your browser 🌐 | Load your ONNX model for true neural summarization.
        </div>
      </footer>
    </main>
  )
}




