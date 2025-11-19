import { useEffect, useRef, useState } from 'react'

function Voice() {
  const recognitionRef = useRef(null)
  const [supported, setSupported] = useState(true)
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('Idle')
  const [liveText, setLiveText] = useState('')
  const [finalText, setFinalText] = useState('')

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
      // Show interim instantly in the div
      setLiveText(interim)
      // Append final text as it arrives
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
        // Calling start twice can throw; ignore if already started
      }
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

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={toggle}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition shadow-lg ${listening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {listening ? 'Stop' : 'Start'} Listening
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
            <h2 className="text-white font-semibold mb-2">Captured</h2>
            <div className="min-h-[96px] text-blue-100 leading-relaxed whitespace-pre-wrap" id="final-text">
              {finalText || <span className="text-blue-300/50">Finalized words will gather here.</span>}
            </div>
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
