import { alignProvenance, splitIntoSentences } from "./provenance"

type GenerateArgs = {
  question: string
  answer: string
  modelFile: File | null
}

type GenerateResult = {
  patient: string
  clinician: string
  patientGrade: number
  clinicianConcepts: string[]
  mapping: { summaryIdx: number; sourceIdxs: number[] }[]
  sourceSentences: string[]
  __adapter: "heuristic" | "onnx"
}

// Minimal medical jargon simplification map
const SIMPLE_MAP: Record<string, string> = {
  hypertension: "high blood pressure",
  hyperglycemia: "high blood sugar",
  hypoglycemia: "low blood sugar",
  myocardial: "heart",
  infarction: "heart attack",
  cerebrovascular: "stroke",
  nephropathy: "kidney disease",
  neuropathy: "nerve damage",
  retinopathy: "eye disease",
  analgesic: "pain reliever",
  antipyretic: "fever reducer",
  dyslipidemia: "high cholesterol",
  gastrointestinal: "stomach and intestines",
  edema: "swelling",
  contraindicated: "not safe to use",
  adverse: "harmful",
}

const DRUG_HINTS = [
  "metformin",
  "insulin",
  "glucose",
  "statin",
  "lisinopril",
  "warfarin",
  "ibuprofen",
  "acetaminophen",
  "omeprazole",
  "amoxicillin",
]

export async function generateSummaries(args: GenerateArgs): Promise<GenerateResult> {
  // If a model file is provided, we prepare ONNX session (no inference adapter hooked yet)
  if (args.modelFile) {
    try {
      const res = await summariseWithOnnx(args)
      if (res) return res
    } catch (e) {
      // fall back to heuristic
      console.log("[v0] ONNX load failed, falling back to heuristic:", e)
    }
  }
  return summariseHeuristically(args)
}

async function summariseWithOnnx({ question, answer, modelFile }: GenerateArgs): Promise<GenerateResult | null> {
  if (!modelFile) return null

  // Load ONNX model in browser. The actual tokenization/decoding adapter depends on your model.
  // This is a stub so you can plug in your exported model pipeline later.
  const ort = await import("onnxruntime-web")
  const buf = await modelFile.arrayBuffer()
  const session = await ort.InferenceSession.create(buf, {
    executionProviders: ["wasm"],
  })

  // TODO: Plug your tokenizer and generation logic here.
  // For now, we still use heuristic summaries while proving local model loading works.
  const result = summariseHeuristically({ question, answer, modelFile: null })
  result.__adapter = "onnx"
  return result
}

function summariseHeuristically({ question, answer }: GenerateArgs): GenerateResult {
  const source = [question, answer].filter(Boolean).join(" ")
  const sourceSentences = splitIntoSentences(source)

  // Clinician summary: preserve key terms, short procedural/therapeutic focus
  const clinicianConcepts = extractMedicalConcepts(answer)
  const clinician = buildClinicianSummary(question, answer, clinicianConcepts)

  // Patient summary: simplify, ensure 6th–8th grade target
  let patient = buildPatientSummary(question, answer)
  let grade = fleschKincaidGrade(patient)
  if (grade > 8) {
    patient = simplifyText(patient)
    grade = fleschKincaidGrade(patient)
  }

  // Provenance: naive alignment of each summary sentence to closest source sentences
  const allSummary = patient + "\n" + clinician
  const mapping = alignProvenance(allSummary, source)

  return {
    patient,
    clinician,
    patientGrade: grade,
    clinicianConcepts,
    mapping,
    sourceSentences,
    __adapter: "heuristic",
  }
}

function buildClinicianSummary(q: string, a: string, concepts: string[]) {
  const key = concepts.length ? `Key terms: ${concepts.slice(0, 8).join(", ")}.` : ""
  const core = pickSalientSentences(a, 3)
  return [core, key].filter(Boolean).join("\n")
}

function buildPatientSummary(q: string, a: string) {
  const lead = `In short: ${simplifyText(pickSalientSentences(a, 2))}`
  const action = deriveActionables(a)
  const caution = "If symptoms worsen or you have concerns, contact a healthcare professional."
  return [lead, action, caution].filter(Boolean).join("\n")
}

function pickSalientSentences(text: string, max: number) {
  const sents = splitIntoSentences(text)
  // Simple heuristic: prefer shorter, info-dense sentences
  const scored = sents.map((s) => ({ s, score: scoreSentence(s) }))
  scored.sort((a, b) => b.score - a.score)
  return scored
    .slice(0, Math.max(1, Math.min(max, scored.length)))
    .map((x) => x.s)
    .join(" ")
}

function scoreSentence(s: string) {
  const len = s.split(/\s+/).length
  const hasNumber = /\d/.test(s) ? 1 : 0
  const hasDrug = DRUG_HINTS.some((d) => s.toLowerCase().includes(d)) ? 1 : 0
  return hasNumber * 2 + hasDrug * 2 + Math.max(0, 20 - Math.abs(15 - len))
}

function deriveActionables(text: string) {
  const lower = text.toLowerCase()
  const actions: string[] = []
  if (/(take|dose|tablet|mg|once|twice)/.test(lower)) actions.push("Follow the prescribed dose and schedule.")
  if (/(diet|eat|food)/.test(lower)) actions.push("Maintain a balanced diet as advised.")
  if (/(exercise|walk|activity)/.test(lower)) actions.push("Stay active with regular, safe exercise.")
  if (/(monitor|check|measure)/.test(lower)) actions.push("Track your measurements as recommended.")
  if (/(side effect|nausea|dizziness|rash|bleeding)/.test(lower))
    actions.push("Watch for side effects and seek help if they appear.")
  return actions.length ? "What to do: " + actions.join(" ") : ""
}

function simplifyText(text: string) {
  let out = text
  // Replace jargon via dictionary
  Object.entries(SIMPLE_MAP).forEach(([k, v]) => {
    out = out.replace(new RegExp(`\\b${escapeRegExp(k)}\\b`, "gi"), v)
  })
  // Shorten long clauses
  out = out.replace(/, which/g, ". It")
  // Remove overly complex parentheticals
  out = out.replace(/\s*$$[^)]*$$/g, "")
  return out
}

function extractMedicalConcepts(text: string) {
  const lower = text.toLowerCase()
  const hits = new Set<string>()
  DRUG_HINTS.forEach((d) => {
    if (lower.includes(d)) hits.add(d)
  })
  // crude metrics for labs/units
  if (/\bmg\b|\bmmol\/L\b|\bHbA1c\b/i.test(text)) hits.add("labs/units")
  if (/\bICD-\d+\b/i.test(text)) hits.add("ICD codes")
  return Array.from(hits)
}

/**
 * Flesch–Kincaid grade estimate
 * Grade = 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
 */
function fleschKincaidGrade(text: string) {
  const sentences = Math.max(1, splitIntoSentences(text).length)
  const words = text.trim().split(/\s+/).filter(Boolean).length || 1
  const syllables = countSyllables(text)
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / Math.max(1, words)) - 15.59
  return Math.max(1, Math.round(grade * 10) / 10)
}

function countSyllables(text: string) {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  return words.reduce((sum, w) => sum + syllablesInWord(w), 0)
}

// naive syllable counter
function syllablesInWord(word: string) {
  word = word.toLowerCase()
  if (word.length <= 3) return 1
  const vowels = "aeiouy"
  let count = 0
  let prevVowel = false
  for (const ch of word) {
    const isVowel = vowels.includes(ch)
    if (isVowel && !prevVowel) count++
    prevVowel = isVowel
  }
  if (word.endsWith("e")) count = Math.max(1, count - 1)
  return Math.max(1, count)
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
