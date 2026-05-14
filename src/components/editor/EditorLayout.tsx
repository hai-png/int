'use client'

import React, { useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useExperienceStore, type SidebarTab, type Vec3 } from '@/store/experience-store'
import { Viewport3D } from '@/components/viewport/Viewport3D'
import { SceneOutline } from '@/components/panels/SceneOutline'
import { HotspotPanel } from '@/components/panels/HotspotPanel'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { ThemePanel } from '@/components/panels/ThemePanel'
import { ExportPanel } from '@/components/panels/ExportPanel'
import { ModelImport } from '@/components/panels/ModelImport'
import { VariableManager } from '@/components/panels/VariableManager'
import { UIPanelBuilder } from '@/components/panels/UIPanelBuilder'
import { SceneManager } from '@/components/panels/SceneManager'
import { WelcomeOverlay } from '@/components/editor/WelcomeOverlay'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import {
  Play,
  Pause,
  Download,
  Layers,
  MapPin,
  Palette,
  FileJson,
  Undo2,
  Redo2,
  Grid3x3,
  Crosshair,
  Sparkles,
  Upload,
  Variable,
  PanelTop,
  BookmarkPlus,
  Camera,
  Ruler,
  Film,
  Activity,
  Keyboard,
  X,
  Save,
  MessageCircle,
  Settings,
  Box,
  Monitor,
  Move,
  RotateCw,
  Maximize2,
} from 'lucide-react'

export function EditorLayout() {
  const {
    projectName,
    setProjectName,
    isPreviewMode,
    setPreviewMode,
    sidebarTab,
    setSidebarTab,
    isAddingHotspot,
    setAddingHotspot,
    isMeasuring,
    setMeasuring,
    showGrid,
    setShowGrid,
    showStats,
    setShowStats,
    theme,
    hotspots,
    isDirty,
    lastSavedAt,
    undo,
    redo,
    history,
    historyIndex,
    pushHistory,
    addCameraBookmark,
    camera,
    importProject,
    measurements,
    removeMeasurement,
    showShortcutsModal,
    setShowShortcutsModal,
    autoSave,
    addAnnotation,
    annotations,
    removeAnnotation,
  } = useExperienceStore()

  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [screenshotToast, setScreenshotToast] = useState(false)
  const [showAnnotationInput, setShowAnnotationInput] = useState(false)
  const [annotationTitle, setAnnotationTitle] = useState('')
  const [annotationContent, setAnnotationContent] = useState('')
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')

  // ── Auto-save every 30 seconds ──────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      autoSave()
    }, 30000)
    return () => clearInterval(interval)
  }, [autoSave])

  // ── Screenshot handler ─────────────────────────────────
  const handleScreenshot = useCallback(() => {
    const capture = (globalThis as Record<string, unknown>).__screenshotCapture as (() => string | null) | undefined
    if (!capture) return
    const dataUrl = capture()
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${projectName.replace(/\s+/g, '_')}_screenshot.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setScreenshotToast(true)
    setTimeout(() => setScreenshotToast(false), 2000)
  }, [projectName])

  // ── Keyboard shortcuts ──────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // If annotation input is open, Escape should close it (even when focus is in an input)
      if (showAnnotationInput && e.key === 'Escape') {
        e.preventDefault()
        setShowAnnotationInput(false)
        setAnnotationTitle('')
        setAnnotationContent('')
        return
      }

      // Don't capture if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return

      const isMod = e.metaKey || e.ctrlKey

      if (e.key === 'p' || e.key === 'P') {
        if (!isMod) {
          e.preventDefault()
          setPreviewMode(!isPreviewMode)
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (!isMod) {
          e.preventDefault()
          setAddingHotspot(true, '3D')
        }
      } else if (e.key === 'g' || e.key === 'G') {
        if (!isMod) {
          e.preventDefault()
          setShowGrid(!showGrid)
        }
      } else if (e.key === 'Escape') {
        setAddingHotspot(false)
        setMeasuring(false)
        setShowShortcutsModal(false)
      } else if (e.key === 'z' && isMod && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.key === 'z' && isMod && e.shiftKey) || (e.key === 'y' && isMod)) {
        e.preventDefault()
        redo()
      } else if (e.key === 's' && isMod) {
        e.preventDefault()
        pushHistory()
        autoSave()
      } else if (e.key === 'b' || e.key === 'B') {
        if (!isMod) {
          e.preventDefault()
          // Save camera bookmark
          const ctrl = (globalThis as Record<string, unknown>).__cameraController as {
            getPosition: () => [number, number, number]
          } | undefined
          if (ctrl) {
            const pos = ctrl.getPosition()
            addCameraBookmark({
              id: `bm_${Date.now()}`,
              name: `Bookmark ${(useExperienceStore.getState().cameraBookmarks.length || 0) + 1}`,
              position: pos,
              target: camera.initialTarget,
            })
          }
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (!isMod) {
          e.preventDefault()
          setMeasuring(!isMeasuring)
        }
      } else if (e.key === '?') {
        setShowShortcutsModal(!showShortcutsModal)
      } else if (e.key === 'i' || e.key === 'I') {
        if (!isMod) {
          e.preventDefault()
          setShowStats(!showStats)
        }
      } else if (e.key === 'w' || e.key === 'W') {
        if (!isMod) {
          setTransformMode('translate')
          const tm = (globalThis as Record<string, unknown>).__transformMode as { setMode: (m: 'translate' | 'rotate' | 'scale') => void } | undefined
          tm?.setMode('translate')
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (!isMod) {
          setTransformMode('rotate')
          const tm = (globalThis as Record<string, unknown>).__transformMode as { setMode: (m: 'translate' | 'rotate' | 'scale') => void } | undefined
          tm?.setMode('rotate')
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (!isMod) {
          e.preventDefault()
          setTransformMode('scale')
          const tm = (globalThis as Record<string, unknown>).__transformMode as { setMode: (m: 'translate' | 'rotate' | 'scale') => void } | undefined
          tm?.setMode('scale')
        }
      }
    },
    [isPreviewMode, showGrid, showStats, isMeasuring, showAnnotationInput, setPreviewMode, setAddingHotspot, setMeasuring, setShowGrid, setShowStats, setShowAnnotationInput, setAnnotationTitle, setAnnotationContent, undo, redo, pushHistory, addCameraBookmark, camera, showShortcutsModal, setShowShortcutsModal, autoSave, setTransformMode]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Project import from file ────────────────────────
  const handleImportFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          importProject(data)
        } catch {
          console.error('Failed to import project')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [importProject])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // Determine what's selected for display
  const selectedHotspotId = useExperienceStore((s) => s.selectedHotspotId)
  const selectedNodeId = useExperienceStore((s) => s.selectedNodeId)
  const selectedHotspotName = useExperienceStore((s) => s.hotspots.find((h) => h.id === s.selectedHotspotId)?.name) ?? 'Unknown'

  // ── Format last saved time ──────────────────────────
  const lastSavedText = lastSavedAt
    ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not saved'

  // ── Sidebar tab config ──────────────────────────
  const sidebarTabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
    { id: 'scene', icon: <Layers size={16} />, label: 'Scene' },
    { id: 'hotspots', icon: <MapPin size={16} />, label: 'Hotspots' },
    { id: 'scenes', icon: <Film size={16} />, label: 'Scenes' },
    { id: 'panels', icon: <PanelTop size={16} />, label: 'Panels' },
    { id: 'variables', icon: <Variable size={16} />, label: 'Vars' },
    { id: 'theme', icon: <Palette size={16} />, label: 'Theme' },
    { id: 'export', icon: <FileJson size={16} />, label: 'Export' },
  ]

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* ── Top Toolbar ─────────────────────────────────── */}
      <header className="h-11 border-b border-white/5 bg-slate-900/80 backdrop-blur-sm flex items-center px-3 gap-1.5 shrink-0">
        {/* Logo & Project Name */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
            <Sparkles size={14} className="text-emerald-400" />
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-sm font-medium bg-transparent border-none focus:outline-none text-slate-200 w-36 hover:bg-slate-800/50 px-1 rounded"
          />
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
          )}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton icon={<Undo2 size={14} />} label="Undo" disabled={!canUndo} onClick={undo} shortcut="⌘Z" />
        <ToolbarButton icon={<Redo2 size={14} />} label="Redo" disabled={!canRedo} onClick={redo} shortcut="⌘⇧Z" />

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Add Hotspot */}
        <button
          onClick={() => setAddingHotspot(true, '3D')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            isAddingHotspot
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-800 border border-white/5'
          }`}
        >
          <Crosshair size={13} />
          <span className="hidden sm:inline">Add Hotspot</span>
          <kbd className="hidden lg:inline text-[9px] text-slate-500 ml-1">H</kbd>
        </button>

        {/* Measurement toggle */}
        <ToolbarButton
          icon={<Ruler size={14} />}
          label="Measure"
          active={isMeasuring}
          onClick={() => setMeasuring(!isMeasuring)}
          shortcut="M"
        />

        {/* Add Annotation */}
        <ToolbarButton
          icon={<MessageCircle size={14} />}
          label="Annotate"
          onClick={() => setShowAnnotationInput(true)}
        />

        {/* Annotation Input Dialog */}
        {showAnnotationInput && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-80 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Add Annotation</h3>
              <input
                type="text"
                placeholder="Title (e.g. Note)"
                value={annotationTitle}
                onChange={(e) => setAnnotationTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                autoFocus
              />
              <textarea
                placeholder="Content (e.g. Click to edit)"
                value={annotationContent}
                onChange={(e) => setAnnotationContent(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAnnotationInput(false)
                    setAnnotationTitle('')
                    setAnnotationContent('')
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const id = `ann_${Date.now()}`
                    const orbitTarget = (globalThis as Record<string, unknown>).__orbitControlsTarget as THREE.Vector3 | undefined
                    const position: Vec3 = orbitTarget ? [orbitTarget.x, orbitTarget.y + 0.5, orbitTarget.z] : [0, 1, 0]
                    addAnnotation({
                      id,
                      position,
                      title: annotationTitle || 'Note',
                      content: annotationContent || 'Click to edit',
                      color: '#10b981',
                      visible: true,
                    })
                    setShowAnnotationInput(false)
                    setAnnotationTitle('')
                    setAnnotationContent('')
                  }}
                  className="px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Grid toggle */}
        <ToolbarButton
          icon={<Grid3x3 size={14} />}
          label="Grid"
          active={showGrid}
          onClick={() => setShowGrid(!showGrid)}
          shortcut="G"
        />

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Transform mode selector (visible when object selected) */}
        {(selectedHotspotId || selectedNodeId) && !isPreviewMode && (
          <>
            <button
              onClick={() => {
                setTransformMode('translate')
                const tm = (globalThis as Record<string, unknown>).__transformMode as { setMode: (m: 'translate' | 'rotate' | 'scale') => void } | undefined
                tm?.setMode('translate')
              }}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition-all ${
                transformMode === 'translate'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              title="Move (W)"
            >
              <Move size={14} />
              <span className="hidden md:inline">Move</span>
            </button>
            <button
              onClick={() => {
                setTransformMode('rotate')
                const tm = (globalThis as Record<string, unknown>).__transformMode as { setMode: (m: 'translate' | 'rotate' | 'scale') => void } | undefined
                tm?.setMode('rotate')
              }}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition-all ${
                transformMode === 'rotate'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              title="Rotate (E)"
            >
              <RotateCw size={14} />
              <span className="hidden md:inline">Rotate</span>
            </button>
            <button
              onClick={() => {
                setTransformMode('scale')
                const tm = (globalThis as Record<string, unknown>).__transformMode as { setMode: (m: 'translate' | 'rotate' | 'scale') => void } | undefined
                tm?.setMode('scale')
              }}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition-all ${
                transformMode === 'scale'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              title="Scale (R)"
            >
              <Maximize2 size={14} />
              <span className="hidden md:inline">Scale</span>
            </button>
          </>
        )}

        {/* Camera Bookmark */}
        <ToolbarButton
          icon={<BookmarkPlus size={14} />}
          label="Bookmark"
          onClick={() => {
            const ctrl = (globalThis as Record<string, unknown>).__cameraController as {
              getPosition: () => [number, number, number]
            } | undefined
            if (ctrl) {
              pushHistory()
              addCameraBookmark({
                id: `bm_${Date.now()}`,
                name: `View ${useExperienceStore.getState().cameraBookmarks.length + 1}`,
                position: ctrl.getPosition(),
                target: camera.initialTarget,
              })
            }
          }}
          shortcut="B"
        />

        {/* Screenshot */}
        <ToolbarButton
          icon={<Camera size={14} />}
          label="Screenshot"
          onClick={handleScreenshot}
        />

        {/* Stats toggle */}
        <ToolbarButton
          icon={<Activity size={14} />}
          label="Stats"
          active={showStats}
          onClick={() => setShowStats(!showStats)}
          shortcut="I"
        />

        <div className="flex-1" />

        {/* Save indicator */}
        <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
          <Save size={10} />
          <span>{lastSavedText}</span>
        </div>

        {/* Import */}
        <ToolbarButton
          icon={<Upload size={14} />}
          label="Import"
          onClick={handleImportFile}
        />

        {/* Shortcuts help */}
        <ToolbarButton
          icon={<Keyboard size={14} />}
          label="Shortcuts"
          onClick={() => setShowShortcutsModal(true)}
          shortcut="?"
        />

        {/* Preview / Edit toggle */}
        <button
          onClick={() => { pushHistory(); setPreviewMode(!isPreviewMode) }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            isPreviewMode
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          {isPreviewMode ? (
            <>
              <Pause size={13} /> Exit
            </>
          ) : (
            <>
              <Play size={13} /> Preview
            </>
          )}
          <kbd className="hidden lg:inline text-[9px] opacity-50 ml-1">P</kbd>
        </button>

        {/* Export */}
        <ToolbarButton
          icon={<Download size={14} />}
          label="Export"
          onClick={() => setSidebarTab('export')}
        />
      </header>

      {/* ── Main Layout ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* ── Left Sidebar (Icon Rail + Panel Content) ──── */}
          <ResizablePanel
            defaultSize={20}
            minSize={14}
            maxSize={28}
            className="min-w-[220px]"
          >
            <div className="h-full flex bg-slate-900/60">
              {/* Icon Rail */}
              <div className="w-10 shrink-0 border-r border-white/5 flex flex-col items-center py-2 gap-0.5 bg-slate-900/80">
                {sidebarTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSidebarTab(tab.id)}
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center transition-all relative group
                      ${sidebarTab === tab.id
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }
                    `}
                    title={tab.label}
                  >
                    {tab.icon}
                    {sidebarTab === tab.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r" />
                    )}
                    {/* Tooltip */}
                    <div className="absolute left-10 z-50 hidden group-hover:block px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-300 whitespace-nowrap border border-white/10 shadow-lg">
                      {tab.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 min-w-0 overflow-hidden">
                {sidebarTab === 'scene' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 min-h-0">
                      <ModelImport />
                    </div>
                    <div className="border-t border-white/5 flex-1 min-h-0">
                      <SceneOutline />
                    </div>
                  </div>
                )}
                {sidebarTab === 'hotspots' && <HotspotPanel />}
                {sidebarTab === 'scenes' && <SceneManager />}
                {sidebarTab === 'panels' && <UIPanelBuilder />}
                {sidebarTab === 'variables' && <VariableManager />}
                {sidebarTab === 'theme' && <ThemePanel />}
                {sidebarTab === 'export' && <ExportPanel />}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-white/5 hover:bg-emerald-500/30 transition-colors" />

          {/* ── 3D Viewport ───────────────────────────────── */}
          <ResizablePanel defaultSize={52} minSize={30}>
            <div className="h-full relative">
              <Viewport3D />

              {/* Screenshot toast */}
              {screenshotToast && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-medium animate-in slide-in-from-top">
                  Screenshot saved!
                </div>
              )}

              {/* Measurement info bar */}
              {measurements.length > 0 && (
                <div className="absolute bottom-14 left-4 z-40 bg-slate-900/90 border border-white/10 rounded-lg px-3 py-2 max-w-xs">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Measurements</div>
                  <div className="space-y-0.5 max-h-20 overflow-y-auto custom-scrollbar">
                    {measurements.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-[10px]">
                        <span className="text-amber-400 font-mono">{m.distance.toFixed(2)}m</span>
                        <button
                          onClick={() => removeMeasurement(m.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-white/5 hover:bg-emerald-500/30 transition-colors" />

          {/* ── Right Properties Panel ────────────────────── */}
          <ResizablePanel
            defaultSize={rightPanelCollapsed ? 0 : 22}
            minSize={rightPanelCollapsed ? 0 : 15}
            maxSize={rightPanelCollapsed ? 0 : 30}
            collapsible
            onCollapse={() => setRightPanelCollapsed(true)}
            onExpand={() => setRightPanelCollapsed(false)}
            className={!rightPanelCollapsed ? 'min-w-[200px]' : ''}
          >
            <div className="h-full bg-slate-900/60 border-l border-white/5">
              <PropertiesPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ── Bottom Status Bar ────────────────────────────── */}
      <footer className="h-7 border-t border-white/5 bg-slate-900/80 flex items-center px-3 gap-3 shrink-0 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${isPreviewMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          {isPreviewMode ? 'Preview' : 'Edit'}
        </span>
        <span>Hotspots: {hotspots.length}</span>
        {measurements.length > 0 && <span>Measurements: {measurements.length}</span>}
        <span>Theme: {theme.hotspotStyle}</span>
        {selectedHotspotId && <span className="text-emerald-400">▸ {selectedHotspotName || 'Hotspot'}</span>}
        {selectedNodeId && !selectedHotspotId && <span className="text-blue-400">▸ Node selected</span>}
        {isDirty && <span className="text-amber-400">Unsaved</span>}
        {!isDirty && lastSavedAt && <span className="text-emerald-500/60">Saved</span>}
        <div className="flex-1" />
        <span className="hidden sm:inline">P: Preview · H: Hotspot · G: Grid · M: Measure · W/E/R: Transform · ?: Help</span>
        <span className="sm:hidden">3D Builder v3.0</span>
      </footer>

      {/* ── Welcome Overlay ──────────────────────────────── */}
      <WelcomeOverlay />

      {/* ── Keyboard Shortcuts Modal ─────────────────────── */}
      {showShortcutsModal && <ShortcutsModal />}
    </div>
  )
}

// ─── Keyboard Shortcuts Modal ──────────────────────────────

function ShortcutsModal() {
  const { setShowShortcutsModal } = useExperienceStore()

  const shortcuts = [
    { keys: 'P', description: 'Toggle preview mode' },
    { keys: 'H', description: 'Add 3D hotspot' },
    { keys: 'G', description: 'Toggle grid' },
    { keys: 'M', description: 'Toggle measurement tool' },
    { keys: 'B', description: 'Bookmark camera position' },
    { keys: 'I', description: 'Toggle scene stats overlay' },
    { keys: 'W', description: 'Move tool (translate)' },
    { keys: 'E', description: 'Rotate tool' },
    { keys: 'R', description: 'Scale tool' },
    { keys: '⌘Z', description: 'Undo' },
    { keys: '⌘⇧Z', description: 'Redo' },
    { keys: '⌘S', description: 'Save snapshot' },
    { keys: 'Esc', description: 'Cancel / Close modal' },
    { keys: '?', description: 'Show this shortcuts panel' },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center"
      onClick={() => setShowShortcutsModal(false)}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-slate-400">{s.description}</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-[10px] text-slate-300 font-mono">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-white/5 bg-slate-900/50">
          <p className="text-[10px] text-slate-600 text-center">
            Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[9px] border border-white/5">?</kbd> anytime to toggle this panel
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────

function ToolbarButton({
  icon,
  label,
  active,
  disabled,
  onClick,
  shortcut,
}: {
  icon: React.ReactNode
  label?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  shortcut?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition-all
        ${active
          ? 'bg-emerald-500/10 text-emerald-400'
          : disabled
          ? 'text-slate-600 cursor-not-allowed'
          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
        }
      `}
      title={label ? `${label}${shortcut ? ` (${shortcut})` : ''}` : undefined}
    >
      {icon}
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  )
}
