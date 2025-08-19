'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ToastProps {
  type: 'success' | 'error'
  message: string
  duration?: number
  onClose: () => void
}

export default function Toast({ type, message, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!mounted) {
    return null // Don't render until mounted to avoid hydration issues
  }

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'
  const Icon = type === 'success' ? CheckIcon : XMarkIcon

  return (
    <div
      className={`fixed top-4 right-4 flex items-center p-4 rounded-md shadow-lg z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${bgColor} text-white max-w-sm`}
    >
      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="ml-3 flex-shrink-0 hover:opacity-75"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}