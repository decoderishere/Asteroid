import { NextRequest, NextResponse } from 'next/server'
import { deleteRun } from '@/lib/run-storage'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { runId } = await request.json()

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 })
    }

    const success = await deleteRun(runId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete run' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Run deleted successfully' 
    })
  } catch (error) {
    console.error('Run delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}