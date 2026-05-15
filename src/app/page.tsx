'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Dynamic import to avoid SSR issues with Three.js
const EditorLayout = dynamic(
  () => import('@/components/editor/EditorLayout').then((mod) => ({ default: mod.EditorLayout })),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
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
          <h2 className="text-lg font-semibold text-emerald-400 mb-1">
            3D Experience Builder
          </h2>
          <p className="text-sm text-slate-500">Initializing 3D engine...</p>
          <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-emerald-500 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    ),
  }
)

export default function Home() {
  return (
    <ErrorBoundary>
      <EditorLayout />
    </ErrorBoundary>
  )
}
