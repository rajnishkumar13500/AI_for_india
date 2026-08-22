import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, MicOff, Bot } from 'lucide-react'
import { askCopilotStream } from '../../api/ai.js'

const SUGGESTIONS = [
  'Aaj business kaisa raha?',
  'Meri sales kyun giri?',
  'Sabse zyada kya bika?',
  'Kal kya stock karu?',
  'Kaunsa product slow chal raha hai?',
  'Agle weekend kya offer doon?',
]

function Message({ msg }) {
  return (
    <div className={`askai-msg ${msg.role}`}>
      <div className="askai-avatar">{msg.role === 'user' ? 'R' : <Bot size={16} />}</div>
      <div className="askai-msg-bubble">
        {msg.content}
        {/* Blinking cursor while streaming */}
        {msg.streaming && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: '1em',
              background: 'currentColor',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              animation: 'askai-cursor-blink 0.7s step-end infinite',
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function AskAI() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)   // true only until first chunk
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef(null)
  const recRef = useRef(null)
  const streamingIdRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = useCallback(async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    // Add an empty streaming AI message
    const msgId = Date.now()
    streamingIdRef.current = msgId
    setMessages(prev => [...prev, { id: msgId, role: 'ai', content: '', streaming: true }])

    let firstChunk = true
    await askCopilotStream(
      q,
      (chunk) => {
        if (firstChunk) { setLoading(false); firstChunk = false }
        setMessages(prev =>
          prev.map(m => m.id === msgId ? { ...m, content: m.content + chunk } : m)
        )
      },
      () => {
        // Stream complete — remove cursor
        setLoading(false)
        setMessages(prev =>
          prev.map(m => m.id === msgId ? { ...m, streaming: false } : m)
        )
      },
      'dashboard'
    )
    setLoading(false)
  }, [input, loading])

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  // Voice input via Web Speech API
  const toggleVoice = useCallback(() => {
    if (isRecording) {
      recRef.current?.stop()
      setIsRecording(false)
      return
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) { alert('Voice input not supported in this browser.'); return }
    const rec = new SpeechRec()
    rec.lang = 'hi-IN'
    rec.interimResults = false
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setIsRecording(false)
    }
    rec.onend = () => setIsRecording(false)
    rec.onerror = () => setIsRecording(false)
    rec.start()
    recRef.current = rec
    setIsRecording(true)
  }, [isRecording])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)', overflow: 'hidden' }}>
      {/* Cursor blink keyframe injected inline */}
      <style>{`@keyframes askai-cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* Header */}
      <div style={{ padding: '32px 32px 0' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dash-text)', marginBottom: 4 }}>🤖 Ask AI</h1>
        <p style={{ color: 'var(--dash-text-2)' }}>Ask about your business in Hindi or English — naturally.</p>
      </div>

      {messages.length === 0 && (
        <div className="askai-hero">
          <div className="askai-icon">🎤</div>
          <h2 style={{ color: 'var(--dash-text)', marginBottom: 6 }}>ASK YOUR BUSINESS</h2>
          <p style={{ color: 'var(--dash-text-2)' }}>Just speak or type naturally</p>
          <div className="askai-chips">
            {SUGGESTIONS.map(s => (
              <button key={s} className="askai-chip" onClick={() => send(s)} id={`btn-suggestion-${s.slice(0,10).replace(/\s/g,'-')}`}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="askai-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px 32px' }}>
        {messages.map((msg, i) => <Message key={msg.id || i} msg={msg} />)}

        {/* Three-dot loader only shown before the FIRST chunk */}
        {loading && (
          <div className="askai-msg ai">
            <div className="askai-avatar"><Bot size={16} /></div>
            <div className="askai-msg-bubble" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '.2s' }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: '.4s' }}>●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="askai-input-bar" style={{ padding: '16px 32px', borderTop: '1px solid var(--dash-border)' }}>
        <input
          className="input askai-input"
          placeholder="Kuch bhi poocho... (Ask anything)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          id="askai-text-input"
        />
        <button
          className={`btn ${isRecording ? 'btn-danger' : 'btn-ghost'} btn-icon`}
          onClick={toggleVoice}
          title={isRecording ? 'Stop recording' : 'Voice input (Hindi)'}
          id="btn-askai-mic"
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button className="btn btn-primary btn-icon" onClick={() => send()} disabled={!input.trim() || loading} id="btn-askai-send">
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
