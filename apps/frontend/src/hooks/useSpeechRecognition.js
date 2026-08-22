import { useRef, useCallback, useState } from 'react'

/**
 * Wraps the browser Web Speech API for voice input.
 * Works in Chrome, Edge, and Safari 14.1+.
 * Provides real-time interim transcripts, language support, and graceful fallback.
 *
 * @param {object} opts
 * @param {(transcript: string) => void} opts.onResult       - Called with the final transcript
 * @param {(interim: string) => void}    [opts.onInterim]   - Called with live interim transcript
 * @param {() => void}                  [opts.onEnd]        - Called when recognition ends
 * @param {(err: any) => void}          [opts.onError]      - Called when recognition has error
 * @param {string}                      [opts.lang]         - BCP-47 language tag, default 'hi-IN'
 */
export function useSpeechRecognition({ onResult, onInterim, onEnd, onError, lang = 'hi-IN' } = {}) {
  const recRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const isSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.({ error: 'not-supported', message: 'Speech recognition is not supported in this browser.' })
      onEnd?.()
      return
    }

    try {
      // Clean up previous instance if running
      if (recRef.current) {
        try { recRef.current.stop() } catch {}
      }

      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SpeechRec()
      rec.lang = lang
      rec.interimResults = true   // enable live transcript while speaking
      rec.maxAlternatives = 1
      rec.continuous = false

      rec.onstart = () => {
        setIsListening(true)
        setInterimText('')
      }

      rec.onresult = (e) => {
        let final = ''
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            final += e.results[i][0].transcript
          } else {
            interim += e.results[i][0].transcript
          }
        }
        if (interim) {
          setInterimText(interim)
          onInterim?.(interim)
        }
        if (final) {
          setInterimText(final)
          onResult?.(final)
        }
      }

      rec.onend = () => {
        setIsListening(false)
        recRef.current = null
        onEnd?.()
      }

      rec.onerror = (e) => {
        console.warn('SpeechRecognition error:', e.error)
        setIsListening(false)
        recRef.current = null
        onError?.(e)
        onEnd?.()
      }

      rec.start()
      recRef.current = rec
    } catch (err) {
      console.warn('Failed to start SpeechRecognition:', err)
      setIsListening(false)
      onError?.(err)
      onEnd?.()
    }
  }, [isSupported, lang, onResult, onInterim, onEnd, onError])

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {}
    recRef.current = null
    setIsListening(false)
  }, [])

  return { start, stop, isSupported, isListening, interimText }
}
