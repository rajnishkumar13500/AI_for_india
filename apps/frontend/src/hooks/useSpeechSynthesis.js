import { useCallback } from 'react'

export function useSpeechSynthesis() {
  const speak = useCallback((text, lang = 'en-IN') => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang
    utt.rate = 0.95
    utt.pitch = 1
    utt.volume = 1
    // Try to find an Indian English voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith('en')) || null
    if (preferred) utt.voice = preferred
    window.speechSynthesis.speak(utt)
  }, [])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  return { speak, stop }
}
