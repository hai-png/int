import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/projects - List all projects (with pagination)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const take = Math.min(parseInt(url.searchParams.get('take') || '50'), 100)
    const skip = parseInt(url.searchParams.get('skip') || '0')

    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, isPublic: true, thumbnail: true, createdAt: true, updatedAt: true },
      take,
      skip,
    })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
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

    const project = await prisma.project.create({
      data: {
        name: body.name || 'Untitled Experience',
        data: JSON.stringify(body.data || {}),
        isPublic: body.isPublic ?? false,
        thumbnail: body.thumbnail || null,
      },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
