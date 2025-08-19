import { NextRequest, NextResponse } from 'next/server'
import { loadRun } from '@/lib/run-storage'
import { generateShareToken, verifyShareToken, validatePasscode } from '@/lib/share-tokens'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { runId, passcode } = await request.json()

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 })
    }

    // Verify run exists
    const run = await loadRun(runId)
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    // Generate share token
    const token = generateShareToken(runId, passcode)
    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/runs/${runId}?t=${token}`

    return NextResponse.json({
      success: true,
      shareUrl,
      // 7 days
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Share token generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const passcode = searchParams.get('passcode') // string | null

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify token
    const tokenData = verifyShareToken(token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // If the shared link was created with a passcode, enforce it
    if (tokenData.passcode) {
      if (!passcode) {
        return NextResponse.json(
          { error: 'Passcode required', requiresPasscode: true },
          { status: 401 }
        )
      }
      if (!validatePasscode(passcode, tokenData.passcode)) {
        return NextResponse.json(
          { error: 'Invalid passcode', requiresPasscode: true },
          { status: 403 }
        )
      }
    }

    // Load and return run data
    const run = await loadRun(tokenData.runId)
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      run,
      readonly: true,
    })
  } catch (error) {
    console.error('Share token validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
