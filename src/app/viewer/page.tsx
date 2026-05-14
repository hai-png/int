'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useExperienceStore, type Vec3 } from '@/store/experience-store'

// ─── Themed Background Loader ────────────────────────────────

function ThemedLoader({ text }: { text: string }) {
  const theme = useExperienceStore((s) => s.theme)
  return (
    <div className="h-screen w-screen flex items-center justify-center" style={{ background: theme.backgroundColor || '#0c1222' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    </div>
  )
}

// Dynamic import to avoid SSR issues with Three.js
const Viewport3D = dynamic(
  () => import('@/components/viewport/Viewport3D').then((mod) => ({ default: mod.Viewport3D })),
  {
    ssr: false,
    loading: () => <ThemedLoader text="Initializing 3D viewer..." />,
  }
)

// ─── Main Viewer Content ──────────────────────────────────────

function ViewerContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')

  // Handle missing project ID via derived state (not in effect)
  const missingId = !projectId

  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>(missingId ? 'not-found' : 'loading')
  const [errorMessage, setErrorMessage] = useState(missingId ? 'No project ID specified in the URL.' : '')
  const [projectName, setProjectName] = useState('')

  const { importProject, setPreviewMode, theme } = useExperienceStore()

  // Cleanup preview mode on unmount
  useEffect(() => {
    return () => {
      useExperienceStore.getState().setPreviewMode(false)
    }
  }, [])

  // Fetch and load project data
  useEffect(() => {
    if (!projectId) return

    let cancelled = false

    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) {
          if (res.status === 404) {
            if (!cancelled) {
              setStatus('not-found')
              setErrorMessage('Project not found. It may have been deleted or the link is incorrect.')
            }
          } else {
            if (!cancelled) {
              setStatus('error')
              setErrorMessage('Failed to load project. Please try again later.')
            }
          }
          return
        }

        const project = await res.json()

        if (cancelled) return

        // Parse the data field - it's stored as a JSON string in the database
        let projectData: Record<string, unknown>
        if (typeof project.data === 'string') {
          try {
            projectData = JSON.parse(project.data)
          } catch {
            projectData = {}
          }
        } else {
          projectData = project.data || {}
        }

        // Ensure projectId is set in the imported data
        projectData.projectId = project.id || projectId

        // Import project data into the store
        importProject(projectData)
        setProjectName(project.name || 'Untitled Experience')

        // Enable preview mode so behaviors execute
        setPreviewMode(true)

        setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setErrorMessage('An unexpected error occurred while loading the project.')
          console.error('[Viewer] Failed to load project:', err)
        }
      }
    }

    loadProject()

    return () => {
      cancelled = true
    }
  }, [projectId, importProject, setPreviewMode])

  // ─── Loading State ───────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: theme.backgroundColor || '#0c1222' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
              <polyline points="2 15.5 12 8.5 22 15.5" />
              <line x1="12" y1="2" x2="12" y2="8.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-emerald-400 mb-1">Loading Experience</h2>
          <p className="text-sm text-slate-500">Fetching project data...</p>
          <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-emerald-500 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Not Found State ─────────────────────────────────────
  if (status === 'not-found' || status === 'error') {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: theme.backgroundColor || '#0c1222' }}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {status === 'not-found' ? 'Project Not Found' : 'Error Loading Project'}
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{errorMessage}</p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/"
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
            >
              Open Editor
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Ready State — Fullscreen 3D Viewer ───────────────────
  return (
    <div className="h-screen w-screen relative overflow-hidden" style={{ background: theme.backgroundColor || '#0c1222' }}>
      {/* The 3D Viewport */}
      <Viewport3D />

      {/* Viewer Chrome — minimal overlays on top of the 3D canvas */}

      {/* Project name badge — top left */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10">
          <span className="text-xs font-medium text-white/80">{projectName}</span>
        </div>
      </div>

      {/* Fullscreen button — top right */}
      <ViewerControls />

      {/* Camera bookmarks bar — bottom center */}
      <CameraBookmarksBar />
    </div>
  )
}

// ─── Viewer Controls (fullscreen, etc.) ──────────────────────

function ViewerControls() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { theme } = useExperienceStore()

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  // Listen for fullscreen changes (e.g. user presses Escape)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  if (!theme.showFullscreenButton) return null

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      <button
        onClick={toggleFullscreen}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        )}
      </button>
    </div>
  )
}

// ─── Camera Bookmarks Bar ─────────────────────────────────────

function CameraBookmarksBar() {
  const { cameraBookmarks } = useExperienceStore()

  if (cameraBookmarks.length === 0) return null

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1.5">
      {cameraBookmarks.map((bm) => (
        <button
          key={bm.id}
          onClick={() => {
            const ctrl = (globalThis as Record<string, unknown>).__cameraController as {
              animateTo: (pos: Vec3, lookAt: Vec3, duration: number) => void
            } | undefined
            ctrl?.animateTo(bm.position, bm.target, 800)
          }}
          className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60 border border-white/10 hover:border-white/20 text-[11px] font-medium transition-all flex items-center gap-1.5"
          title={`Move camera to ${bm.name}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          {bm.name}
        </button>
      ))}
    </div>
  )
}

// ─── Page Export with Suspense Boundary ────────────────────────

export default function ViewerPage() {
  return (
    <Suspense
      fallback={<ThemedLoader text="Loading viewer..." />}
    >
      <ViewerContent />
    </Suspense>
  )
}
