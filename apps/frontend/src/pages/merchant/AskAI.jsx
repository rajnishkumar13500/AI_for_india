import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Bot } from 'lucide-react'
import { askCopilot } from '../../api/ai.js'
import { useAudioRecorder } from '../../hooks/useAudioRecorder.js'

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
      <div className="askai-msg-bubble">{msg.content}</div>
    </div>
  )
}

export default function AskAI() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { isRecording, startRecording, stopRecording } = useAudioRecorder()

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const answer = await askCopilot(q)
      setMessages(prev => [...prev, { role: 'ai', content: answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Kuch gadbad ho gayi. Backend se connect nahi ho paya.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)', overflow: 'hidden' }}>
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
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
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
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? 'Stop recording' : 'Voice input'}
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
