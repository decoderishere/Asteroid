'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: 'success' | 'error', message: string, duration?: number) => {
    // Only run on client side to avoid hydration issues
    if (typeof window === 'undefined') return
    
    const id = Date.now().toString()
    const newToast: Toast = { id, type, message, duration }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, duration || 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    showToast('success', message, duration)
  }, [showToast])

  const error = useCallback((message: string, duration?: number) => {
    showToast('error', message, duration)
  }, [showToast])

  return {
    toasts,
    success,
    error,
    removeToast
  }
}