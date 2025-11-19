import { useEffect, useRef, useState } from 'react'

function Voice() {
  const recognitionRef = useRef(null)
  const [supported, setSupported] = useState(true)
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('Idle')
  const [liveText, setLiveText] = useState('')
  const [finalText, setFinalText] = useState('')

  const [aiLoading, setAiLoading] = useState(false)
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onstart = () => {
      setStatus('Listening...')
      setListening(true)
    }
    recognition.onend = () => {
      setStatus('Stopped')
      setListening(false)
    }
    recognition.onerror = (e) => {
      setStatus(e.error === 'no-speech' ? 'No speech detected' : `Error: ${e.error}`)
      setListening(false)
    }

    recognition.onresult = (event) => {
      let interim = ''
      let finalChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalChunk += transcript
        } else {
          interim += transcript
        }
      }
      setLiveText(interim)
      if (finalChunk) {
        setFinalText((prev) => (prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalChunk).trim())
        setLiveText('')
      }
    }

    recognitionRef.current = recognition

    return () => {
      try {
        recognition.stop()
      } catch {}
    }
  }, [])

  const toggle = () => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
    } else {
      setStatus('Starting...')
      try {
        recognitionRef.current.start()
      } catch (e) {
        // ignore double-start errors
      }
    }
  }

  const clearAll = () => {
    setLiveText('')
    setFinalText('')
    setAiAnswer('')
    setAiError('')
  }

  const searchAI = async () => {
    const text = (finalText + (liveText ? ' ' + liveText : '')).trim()
    setAiAnswer('')
    setAiError('')
    if (!text) {
      setAiError('Nothing to search. Speak or type something first.')
      return
    }
    const base = import.meta.env.VITE_BACKEND_URL || ''
    const url = `${base}/api/ai/query`
    setAiLoading(true)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'AI request failed')
      }
      const data = await res.json()
      setAiAnswer(data.answer || '')
    } catch (e) {
      setAiError(e.message || 'Request failed')
    } finally {
      setAiLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-slate-800/60 border border-blue-500/20 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">Voice to Text</h1>
          <p className="text-blue-200">Your browser does not support the Web Speech API. Please use the latest Chrome, Edge, or Safari.</p>
          <a href="/" className="inline-block mt-6 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white">Back</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Voice to Text</h1>
          <p className="text-blue-200 mt-2">Press start and speak. Your words will appear live below.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={toggle}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition shadow-lg ${listening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {listening ? 'Stop' : 'Start'} Listening
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-3 rounded-xl font-semibold text-white bg-slate-700 hover:bg-slate-600 shadow"
          >
            Clear
          </button>
          <span className={`text-sm px-3 py-1 rounded-full border ${listening ? 'border-green-400 text-green-300' : 'border-blue-300 text-blue-200'}`}>
            {status}
          </span>
        </div>

        <div className="grid gap-6">
          <div className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-2">Live</h2>
            <div className="min-h-[72px] text-blue-100 leading-relaxed" id="live-text">
              {liveText || <span className="text-blue-300/50">Speak to see text appear here instantly…</span>}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-semibold">Captured</h2>
              <button
                onClick={searchAI}
                disabled={aiLoading}
                className={`px-3 py-2 rounded-lg text-white text-sm font-medium shadow ${aiLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {aiLoading ? 'Searching…' : 'Search with AI'}
              </button>
            </div>
            <div className="min-h-[96px] text-blue-100 leading-relaxed whitespace-pre-wrap" id="final-text">
              {finalText || <span className="text-blue-300/50">Finalized words will gather here.</span>}
            </div>
            {(aiAnswer || aiError) && (
              <div className="mt-5 p-4 rounded-xl border bg-slate-900/40 border-blue-500/20">
                <h3 className="text-white font-semibold mb-2">AI Result</h3>
                {aiError ? (
                  <p className="text-red-300 text-sm">{aiError}</p>
                ) : (
                  <pre className="whitespace-pre-wrap text-blue-100 text-sm">{aiAnswer}</pre>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="inline-block px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-blue-100">Back to Home</a>
        </div>
      </div>
    </div>
  )
}

export default Voice
