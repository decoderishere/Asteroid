import { NextRequest, NextResponse } from 'next/server'
import { loadRunIndex } from '@/lib/run-storage'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const project = searchParams.get('project')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const index = await loadRunIndex()
    let runs = index.runs

    // Filter by project if specified
    if (project) {
      runs = runs.filter(run => 
        run.projectName?.toLowerCase().includes(project.toLowerCase())
      )
    }

    // Apply pagination
    const total = runs.length
    const paginatedRuns = runs.slice(offset, offset + limit)

    return NextResponse.json({
      runs: paginatedRuns,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Runs list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}