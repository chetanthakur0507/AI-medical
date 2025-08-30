export function splitIntoSentences(text: string) {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.?!])\s+/))
    .map((s) => s.trim())
    .filter(Boolean)
}

export function alignProvenance(summary: string, source: string) {
  const sumSents = splitIntoSentences(summary)
  const srcSents = splitIntoSentences(source)

  const srcVectors = srcSents.map((s) => tfidfVector(s, srcSents))
  const mapping: { summaryIdx: number; sourceIdxs: number[] }[] = []

  sumSents.forEach((s, i) => {
    const v = tfidfVector(s, srcSents)
    // find top 2 closest source sentences by cosine similarity
    const sims = srcVectors.map((u, idx) => ({ idx, sim: cosine(u, v) }))
    sims.sort((a, b) => b.sim - a.sim)
    const best = sims.slice(0, Math.min(2, sims.length)).filter((x) => x.sim > 0)
    mapping.push({ summaryIdx: i, sourceIdxs: best.map((b) => b.idx) })
  })

  return mapping
}

function tfidfVector(sent: string, corpus: string[]) {
  const tokens = tokenize(sent)
  const vocab = new Map<string, number>()
  let i = 0
  tokens.forEach((t) => {
    if (!vocab.has(t)) vocab.set(t, i++)
  })
  const vec = new Float32Array(vocab.size)
  tokens.forEach((t) => {
    const idx = vocab.get(t)!
    vec[idx] += 1
  })
  // idf weighting
  for (const [t, idx] of vocab.entries()) {
    const df = corpus.reduce((n, s) => (tokenize(s).includes(t) ? n + 1 : n), 0)
    const idf = Math.log((1 + corpus.length) / (1 + df)) + 1
    vec[idx] *= idf
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0))
  if (norm > 0) for (let j = 0; j < vec.length; j++) vec[j] /= norm
  return vec
}

function tokenize(s: string) {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 1)
}

function cosine(a: Float32Array, b: Float32Array) {
  const n = Math.max(a.length, b.length)
  let dot = 0
  for (let i = 0; i < n; i++) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    dot += av * bv
  }
  // both are normalized; cosine equals dot
  return dot
}
