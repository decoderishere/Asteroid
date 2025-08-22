import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SectionRenderResult, RenderSectionRequest } from '@/lib/types/sections'
import { SectionStateMachine } from '@/lib/services/sectionStateMachine'
import { renderSection } from '@/lib/services/sectionRenderer'
import { mockDb } from '@/lib/services/mockDatabase'

const RenderRequestSchema = z.object({
  force: z.boolean().optional().default(false)
})

// POST /api/sections/:sectionId/render
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params
    const body = await request.json()
    const { force } = RenderRequestSchema.parse(body)

    // Find the section
    const section = mockDb.sections.findById(sectionId)
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    // Get input requests for this section
    const inputRequests = mockDb.inputRequests.findBySection(sectionId)

    // Check if section is ready to render
    if (section.state !== 'ready_to_render' && section.state !== 'rendered') {
      return NextResponse.json(
        { 
          error: 'Section is not ready to render',
          currentState: section.state,
          missingInputs: SectionStateMachine.getMissingRequiredInputs(section.sectionKey, inputRequests)
        },
        { status: 400 }
      )
    }

    // Skip rendering if already rendered and not forced
    if (section.state === 'rendered' && section.renderedContent && !force) {
      return NextResponse.json({
        message: 'Section already rendered',
        sectionId,
        renderedAt: section.renderedAt,
        cached: true
      })
    }

    // Prepare input values for rendering
    const inputValues: Record<string, any> = {}
    const inputsUsed: string[] = []

    for (const inputRequest of inputRequests) {
      if (inputRequest.isResolved) {
        inputValues[inputRequest.inputKey] = inputRequest.resolvedValue
        inputsUsed.push(inputRequest.inputKey)
      }
    }

    // Render the section
    const renderResult = await renderSection(section.sectionKey, inputValues, {
      documentId: section.documentId,
      sectionId: section.id
    })

    if (!renderResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to render section',
          details: renderResult.error,
          warnings: renderResult.warnings
        },
        { status: 500 }
      )
    }

    // Update section with rendered content
    const now = new Date().toISOString()
    const transition = SectionStateMachine.transitionSection(
      section,
      'rendered',
      'render_completed'
    )

    if (!transition.success) {
      return NextResponse.json(
        { error: `Failed to transition section state: ${transition.error}` },
        { status: 500 }
      )
    }

    const updatedSection = {
      ...transition.newSection,
      renderedContent: renderResult.markdown,
      renderedHtml: renderResult.html,
      renderedAt: now
    }

    // Update in mock database
    mockDb.sections.update(sectionId, updatedSection)

    const result: SectionRenderResult = {
      sectionId,
      markdown: renderResult.markdown,
      html: renderResult.html,
      wordCount: renderResult.wordCount,
      renderedAt: now,
      inputsUsed,
      warnings: renderResult.warnings
    }

    return NextResponse.json({
      message: 'Section rendered successfully',
      result,
      section: updatedSection
    })

  } catch (error) {
    console.error('Error rendering section:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to render section' },
      { status: 500 }
    )
  }
}

// GET /api/sections/:sectionId/render (get rendered content)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'markdown' // 'markdown' or 'html'

    // Find the section
    const section = mockDb.sections.findById(sectionId)
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    if (section.state !== 'rendered' || !section.renderedContent) {
      return NextResponse.json(
        { 
          error: 'Section has not been rendered yet',
          currentState: section.state
        },
        { status: 404 }
      )
    }

    const content = format === 'html' ? section.renderedHtml : section.renderedContent
    const mimeType = format === 'html' ? 'text/html' : 'text/markdown'

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="section_${section.sectionKey}.${format === 'html' ? 'html' : 'md'}"`
      }
    })

  } catch (error) {
    console.error('Error fetching rendered section:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rendered section' },
      { status: 500 }
    )
  }
}