'use client';

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  lastMessage: any
  sendMessage: (event: string, data: any) => void
  error: string | null
}

export function useWebSocket(url: string = 'http://localhost:5000'): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      retries: 3
    })

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      console.log('🔌 WebSocket connected')
    })

    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('🔌 WebSocket disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      setError(err.message)
      setIsConnected(false)
      console.error('🔌 WebSocket connection error:', err)
    })

    // Listen for system health updates
    socket.on('systemHealth', (data) => {
      setLastMessage({ type: 'systemHealth', data, timestamp: Date.now() })
    })

    // Listen for AI results
    socket.on('aiResult', (data) => {
      setLastMessage({ type: 'aiResult', data, timestamp: Date.now() })
    })

    // Listen for file changes
    socket.on('fileChanged', (data) => {
      setLastMessage({ type: 'fileChanged', data, timestamp: Date.now() })
    })

    // Listen for deployment updates
    socket.on('deploymentUpdate', (data) => {
      setLastMessage({ type: 'deploymentUpdate', data, timestamp: Date.now() })
    })

    // Listen for terminal output
    socket.on('terminalOutput', (data) => {
      setLastMessage({ type: 'terminalOutput', data, timestamp: Date.now() })
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [url])

  const sendMessage = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('Socket not connected. Cannot send message:', { event, data })
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    sendMessage,
    error
  }
}
