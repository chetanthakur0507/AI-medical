import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import "./index.css"
import Upload from "./pages/Upload.jsx"
import Summary from "./pages/Summary.jsx"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-pretty">Medical Summarizer</h1>
            <nav>
              <a className="text-sm hover:underline" href="/">
                Upload
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/summary" element={<Summary />} />
          </Routes>
        </main>
        <footer className="border-t bg-white">
          <div className="mx-auto max-w-4xl px-4 py-4 text-sm text-neutral-600">
            This summary is AI-generated. Consult a healthcare professional before making decisions.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
