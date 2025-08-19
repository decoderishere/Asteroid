"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Star, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  runId: string
  project?: string
}

export function FeedbackDialog({ open, onOpenChange, runId, project }: FeedbackDialogProps) {
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const resetForm = () => {
    setRating(0)
    setMessage('')
    setEmail('')
    setIsSubmitted(false)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(resetForm, 200) // Reset after dialog closes
    }
    onOpenChange(open)
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId,
          project,
          rating,
          message: message.trim() || undefined,
          email: email.trim() || undefined,
          createdAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      setIsSubmitted(true)
      toast.success('Thank you for your feedback!')
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose(false)
      }, 2000)
    } catch (error) {
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your experience with this document generation.
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <div className="space-y-4 py-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Overall rating *
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={`h-6 w-6 ${
                        star <= rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating > 0 && `${rating}/5`}
                </span>
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="feedback-message" className="block text-sm font-medium mb-2">
                Comments (optional)
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border rounded-md resize-none"
                rows={3}
                placeholder="Tell us what worked well or could be improved..."
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="feedback-email" className="block text-sm font-medium mb-2">
                Email (optional)
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-md"
                placeholder="your.email@example.com"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Only if you'd like a follow-up response
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Feedback Submitted!</h3>
            <p className="text-muted-foreground">
              Thank you for helping us improve. This dialog will close automatically.
            </p>
          </div>
        )}

        {!isSubmitted && (
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}