import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Validate that id is a non-empty string
function validateId(id: string): string | null {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return 'id must be a non-empty string'
  }
  return null
}

// GET /api/projects/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idError = validateId(id)
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// PUT /api/projects/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idError = validateId(id)
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 })
    }

    const body = await request.json()

    // Validate name: must be a non-empty string if provided
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 })
    }

    // Validate data: must be a valid object if provided
    if (body.data !== undefined && (typeof body.data !== 'object' || body.data === null || Array.isArray(body.data))) {
      return NextResponse.json({ error: 'data must be a valid object' }, { status: 400 })
    }

    // Validate isPublic: must be boolean if provided
    if (body.isPublic !== undefined && typeof body.isPublic !== 'boolean') {
      return NextResponse.json({ error: 'isPublic must be a boolean' }, { status: 400 })
    }

    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        data: body.data ? JSON.stringify(body.data) : undefined,
        isPublic: body.isPublic,
        thumbnail: body.thumbnail,
      },
    })
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idError = validateId(id)
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 })
    }

    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
