function splitSentences(text) {
  return (text || "").split(/(?<=[.!?])\s+/).filter(Boolean)
}

export default function SummaryCard({ title, text, provenance = [], accent = "primary" }) {
  const sentences = splitSentences(text)

  const provMap = new Map()
  provenance.forEach((p) => provMap.set(p.summary_sentence, p))

  return (
    <article className="rounded border bg-white">
      <header className={`border-b px-4 py-3 font-semibold text-white bg-${accent}`}>{title}</header>
      <div className="p-4 space-y-3">
        {sentences.map((s, idx) => {
          const p = provMap.get(s)
          return (
            <div key={idx} className="space-y-1">
              <p className="leading-relaxed">{s}</p>
              {p && (
                <details className="text-sm text-neutral-700">
                  <summary className="cursor-pointer">Source Section #{p.section_id}</summary>
                  <div className="mt-1 rounded bg-neutral-50 p-2 border text-neutral-700">
                    {p.section_text}
                    <div className="mt-1 text-xs text-neutral-500">Match score: {p.score.toFixed(2)}</div>
                  </div>
                </details>
              )}
            </div>
          )
        })}
      </div>
    </article>
  )
}
