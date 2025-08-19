import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { validateFilePath, generateNiceFilename } from '@/lib/file-validation'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const projectName = searchParams.get('project_name')
    const generatedDate = searchParams.get('generated_date')
    const runId = searchParams.get('run_id')

    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter required' }, { status: 400 })
    }

    // Validate file path with enhanced security checks
    const validation = validateFilePath(filePath)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 403 })
    }

    // Try public first, then data directory
    const publicPath = join(process.cwd(), 'public', validation.normalizedPath!)
    const dataPath = join(process.cwd(), 'data', validation.normalizedPath!)

    let fullPath: string
    if (existsSync(publicPath)) {
      fullPath = publicPath
    } else if (existsSync(dataPath)) {
      fullPath = dataPath
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = await readFile(fullPath)
    const originalFilename = validation.normalizedPath!.split('/').pop() || 'download'

    // Generate nice filename
    const niceFilename = generateNiceFilename(
      originalFilename,
      projectName || undefined,
      generatedDate || undefined,
      runId || undefined
    )

    // Determine content type based on extension
    const ext = originalFilename.split('.').pop()?.toLowerCase()
    const contentType =
      ({
        pdf: 'application/pdf',
        md: 'text/markdown',
        html: 'text/html',
        json: 'application/json',
        txt: 'text/plain',
      } as Record<string, string>)[ext || ''] || 'application/octet-stream'

    // Wrap Buffer so it's a valid BodyInit
    const body = new Blob([fileBuffer])

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${niceFilename}"`,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
