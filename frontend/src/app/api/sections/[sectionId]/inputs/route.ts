import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { InputRequest, UpdateInputRequest } from '@/lib/types/sections'
import { SectionStateMachine } from '@/lib/services/sectionStateMachine'
import { mockDb } from '@/lib/services/mockDatabase'

const UpdateInputSchema = z.object({
  value: z.any().optional(),
  fileId: z.string().optional()
}).refine(data => data.value !== undefined || data.fileId !== undefined, {
  message: "Either value or fileId must be provided"
})

// POST /api/sections/:sectionId/inputs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params
    const body = await request.json()
    const { inputKey, value, fileId } = body

    if (!inputKey) {
      return NextResponse.json(
        { error: 'inputKey is required' },
        { status: 400 }
      )
    }

    // Find the input request
    const inputRequest = mockDb.inputRequests.findBySectionAndKey(sectionId, inputKey)

    if (!inputRequest) {
      return NextResponse.json(
        { error: 'Input request not found' },
        { status: 404 }
      )
    }

    // Find the section to get the section key for validation
    const section = mockDb.sections.findById(sectionId)
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    // Validate the input value
    const validationResult = SectionStateMachine.validateInputValue(
      inputKey,
      value,
      section.sectionKey
    )

    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors: validationResult.errors
        },
        { status: 400 }
      )
    }

    // Update the input request
    const now = new Date().toISOString()
    const updatedInputRequest: InputRequest = {
      ...inputRequest,
      isResolved: true,
      resolvedAt: now,
      resolvedValue: value,
      resolvedFileId: fileId,
      updatedAt: now
    }

    // Update in mock database
    mockDb.inputRequests.update(inputRequest.id, updatedInputRequest)

    // Check if this resolves all required inputs for the section
    const allSectionInputs = mockDb.inputRequests.findBySection(sectionId)
    const allResolved = SectionStateMachine.areAllRequiredInputsResolved(
      section.sectionKey,
      allSectionInputs
    )

    // Update section state if needed
    let updatedSection = section
    if (allResolved && section.state === 'pending_inputs') {
      const transition = SectionStateMachine.transitionSection(
        section,
        'ready_to_render',
        'inputs_resolved'
      )

      if (transition.success && transition.newSection) {
        mockDb.sections.update(sectionId, transition.newSection)
        updatedSection = transition.newSection
      }
    }

    return NextResponse.json({
      message: 'Input updated successfully',
      inputRequest: updatedInputRequest,
      section: updatedSection,
      allInputsResolved: allResolved
    })

  } catch (error) {
    console.error('Error updating input:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update input' },
      { status: 500 }
    )
  }
}

// GET /api/sections/:sectionId/inputs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params

    // Get all input requests for this section
    const inputRequests = mockDb.inputRequests.findBySection(sectionId)
    
    // Get section info
    const section = mockDb.sections.findById(sectionId)
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    const resolvedInputs = inputRequests.filter(ir => ir.isResolved)
    const unresolvedInputs = inputRequests.filter(ir => !ir.isResolved)
    const missingRequired = SectionStateMachine.getMissingRequiredInputs(
      section.sectionKey,
      inputRequests
    )

    return NextResponse.json({
      sectionId,
      sectionKey: section.sectionKey,
      sectionState: section.state,
      inputRequests,
      summary: {
        total: inputRequests.length,
        resolved: resolvedInputs.length,
        unresolved: unresolvedInputs.length,
        missingRequired: missingRequired.length,
        missingRequiredKeys: missingRequired
      }
    })

  } catch (error) {
    console.error('Error fetching section inputs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch section inputs' },
      { status: 500 }
    )
  }
}