import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { run } = await request.json()

    if (!run || !run.run_id) {
      return NextResponse.json({ error: 'Run data with run_id required' }, { status: 400 })
    }

    // Ensure logs directory exists
    const logsDir = join(process.cwd(), 'data', 'logs')
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true })
    }

    // Write log file
    const logPath = join(logsDir, `${run.run_id}.json`)
    await writeFile(logPath, JSON.stringify({
      ...run,
      logged_at: new Date().toISOString(),
    }, null, 2))

    return NextResponse.json({ 
      success: true, 
      message: 'Run logged successfully',
      path: logPath.replace(process.cwd(), '').replace(/^\//, '')
    })
  } catch (error) {
    console.error('Log creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}