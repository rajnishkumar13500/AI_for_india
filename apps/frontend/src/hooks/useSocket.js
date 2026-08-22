import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_URL, MERCHANT_ID } from '../api/config.js'

// singleton socket instance
let socket = null

export function useSocket(eventHandlers = {}) {
  const handlersRef = useRef(eventHandlers)
  handlersRef.current = eventHandlers

  const connect = useCallback(() => {
    if (socket?.connected) return
    socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
      socket.emit('join:merchant', MERCHANT_ID)
    })

    socket.on('disconnect', () => console.log('[Socket] Disconnected'))

    // Bind all handlers
    const events = [
      'session:started', 'session:processing', 'session:extracted',
      'session:reconciled', 'payment:received', 'transaction:created',
      'transaction:confirmed', 'demo:reset',
    ]
    events.forEach(evt => {
      socket.on(evt, (data) => {
        if (handlersRef.current[evt]) handlersRef.current[evt](data)
      })
    })
  }, [])

  const disconnect = useCallback(() => {
    socket?.disconnect()
    socket = null
  }, [])

  useEffect(() => {
    connect()
    return () => {
      // Don't disconnect on unmount — keep singleton alive across pages
    }
  }, [connect])

  return { socket, connect, disconnect }
}
