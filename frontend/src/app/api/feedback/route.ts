import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const feedback = await request.json()

    if (!feedback.run_id || !feedback.rating) {
      return NextResponse.json({ 
        error: 'run_id and rating are required' 
      }, { status: 400 })
    }

    // Validate rating
    if (feedback.rating < 1 || feedback.rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 })
    }

    // Create monthly directory structure
    const now = new Date()
    const monthDir = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    const feedbackDir = join(process.cwd(), 'data', 'feedback', monthDir)
    
    if (!existsSync(feedbackDir)) {
      await mkdir(feedbackDir, { recursive: true })
    }

    // Write feedback file
    const feedbackPath = join(feedbackDir, `${feedback.run_id}.json`)
    await writeFile(feedbackPath, JSON.stringify({
      ...feedback,
      submitted_at: new Date().toISOString(),
    }, null, 2))

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully' 
    })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}