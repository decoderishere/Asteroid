import { NextRequest, NextResponse } from 'next/server'
import archiver from 'archiver'
import { createReadStream, existsSync, lstatSync, readdirSync } from 'fs'
import { join } from 'path'
import { validateFilePath, generateNiceFilename } from '@/lib/file-validation'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { dir, project_name, generated_date, run_id } = await request.json()

    if (!dir || typeof dir !== 'string') {
      return NextResponse.json({ error: 'Directory path required' }, { status: 400 })
    }

    // Validate directory path with enhanced security checks
    const validation = validateFilePath(dir)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 403 })
    }

    // Try public first, then data directory
    const publicPath = join(process.cwd(), 'public', validation.normalizedPath!)
    const dataPath = join(process.cwd(), 'data', validation.normalizedPath!)
    
    let fullPath: string
    if (existsSync(publicPath) && lstatSync(publicPath).isDirectory()) {
      fullPath = publicPath
    } else if (existsSync(dataPath) && lstatSync(dataPath).isDirectory()) {
      fullPath = dataPath
    } else {
      return NextResponse.json({ error: 'Directory not found' }, { status: 404 })
    }

    // Generate nice filename for ZIP
    const basename = validation.normalizedPath!.split('/').pop() || 'documents'
    const niceFilename = generateNiceFilename(
      `${basename}.zip`,
      project_name,
      generated_date,
      run_id
    )
    
    // Create readable stream for ZIP
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // Create archiver instance
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    // Handle archiver errors
    archive.on('error', (err) => {
      console.error('Archive error:', err)
      writer.close()
    })

    // Pipe archive to stream
    const chunks: Uint8Array[] = []
    archive.on('data', (chunk) => {
      chunks.push(new Uint8Array(chunk))
    })
    
    archive.on('end', async () => {
      try {
        // Concatenate all chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        const result = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
          result.set(chunk, offset)
          offset += chunk.length
        }
        
        await writer.write(result)
        await writer.close()
      } catch (error) {
        console.error('Writer error:', error)
        writer.close()
      }
    })

    // Add files to archive
    const addFilesToArchive = (dirPath: string, baseDir: string = '') => {
      const files = readdirSync(dirPath)
      for (const file of files) {
        const filePath = join(dirPath, file)
        const relativePath = join(baseDir, file)
        
        if (lstatSync(filePath).isDirectory()) {
          addFilesToArchive(filePath, relativePath)
        } else {
          archive.file(filePath, { name: relativePath })
        }
      }
    }

    addFilesToArchive(fullPath)
    await archive.finalize()

    return new NextResponse(readable, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${niceFilename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('ZIP creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}