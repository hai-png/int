'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useExperienceStore } from '@/store/experience-store'
import {
  Upload,
  Link,
  FileBox,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export function ModelImport() {
  const { model, setModel } = useExperienceStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileUpload = useCallback(
    (file: File) => {
      setImportStatus('loading')
      setErrorMessage('')

      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const name = file.name.replace(/\.(glb|gltf)$/, '')

        setModel({
          url: dataUrl,
          name,
          scale: 1,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
        })
        setImportStatus('success')
        setTimeout(() => setImportStatus('idle'), 3000)
      }
      reader.onerror = () => {
        setImportStatus('error')
        setErrorMessage('Failed to load model. Please ensure it is a valid GLTF/GLB file.')
      }
      reader.readAsDataURL(file)
    },
    [setModel]
  )

  const handleUrlImport = useCallback(() => {
    if (!urlInput.trim()) return
    setImportStatus('loading')
    setErrorMessage('')

    try {
      const name = urlInput.split('/').pop()?.replace(/\.(glb|gltf)$/, '') || 'Imported Model'
      setModel({
        url: urlInput.trim(),
        name,
        scale: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      })
      setImportStatus('success')
      setUrlInput('')
      setTimeout(() => setImportStatus('idle'), 3000)
    } catch {
      setImportStatus('error')
      setErrorMessage('Failed to import model from URL.')
    }
  }, [urlInput, setModel])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
        handleFileUpload(file)
      } else {
        setImportStatus('error')
        setErrorMessage('Please upload a .glb or .gltf file')
      }
    },
    [handleFileUpload]
  )

  const loadDemoModel = useCallback((modelKey: string) => {
    // Use public KhronosGroup GLTF samples from GitHub
    const demoModels: Record<string, { url: string; name: string; scale: number; position: [number, number, number]; rotation: [number, number, number] }> = {
      avocado: {
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb',
        name: 'Avocado',
        scale: 30,
        position: [0, 0.3, 0],
        rotation: [0, 0, 0],
      },
      duck: {
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
        name: 'Duck',
        scale: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
      suzanne: {
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Suzanne/glTF-Binary/Suzanne.glb',
        name: 'Suzanne',
        scale: 1,
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
      },
    }
    const demo = demoModels[modelKey]
    if (!demo) return
    setModel(demo)
    setImportStatus('success')
    setTimeout(() => setImportStatus('idle'), 3000)
  }, [setModel])

  const removeModel = useCallback(() => {
    setModel(null)
    setImportStatus('idle')
  }, [setModel])

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Model Import
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {model ? (
          // Model loaded state
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-emerald-300 truncate">
                  {model.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{model.url}</div>
              </div>
              <button
                onClick={removeModel}
                className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>

            {/* Model settings */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="text-[9px] text-slate-500">Scale</label>
                  <input
                    type="number"
                    step={0.1}
                    value={model.scale}
                    onChange={(e) =>
                      setModel({ ...model, scale: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-slate-500">Position</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                    <div key={axis}>
                      <div className="text-[9px] text-slate-600">{axis}</div>
                      <input
                        type="number"
                        step={0.1}
                        value={model.position[i]}
                        onChange={(e) => {
                          const newPos: [number, number, number] = [...model.position]
                          newPos[i] = parseFloat(e.target.value) || 0
                          setModel({ ...model, position: newPos })
                        }}
                        className="w-full px-1.5 py-1 text-[10px] bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // No model state
          <div className="p-3 space-y-3">
            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
            >
              <Upload size={24} className="mx-auto text-slate-500 mb-2" />
              <p className="text-xs text-slate-400 mb-1">
                Drag & drop GLTF/GLB files
              </p>
              <p className="text-[10px] text-slate-600">
                or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                className="hidden"
              />
            </div>

            {/* URL import */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">
                Import from URL
              </label>
              <div className="flex gap-1">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/model.glb"
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlImport()
                  }}
                />
                <button
                  onClick={handleUrlImport}
                  disabled={!urlInput.trim()}
                  className="px-2 py-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Link size={14} />
                </button>
              </div>
            </div>

            {/* Demo models */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">
                Demo Models
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => loadDemoModel('avocado')}
                  className="w-full flex items-center gap-2 p-2 rounded-lg border border-white/5 hover:border-white/10 bg-slate-800/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center">
                    <FileBox size={14} className="text-green-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-slate-300">
                      Avocado
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Khronos PBR sample
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => loadDemoModel('duck')}
                  className="w-full flex items-center gap-2 p-2 rounded-lg border border-white/5 hover:border-white/10 bg-slate-800/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center">
                    <FileBox size={14} className="text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-slate-300">
                      Duck
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Khronos GLTF sample
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => loadDemoModel('suzanne')}
                  className="w-full flex items-center gap-2 p-2 rounded-lg border border-white/5 hover:border-white/10 bg-slate-800/30 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center">
                    <FileBox size={14} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-slate-300">
                      Suzanne
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Classic monkey head
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Status */}
            {importStatus === 'loading' && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Loader2 size={14} className="animate-spin" />
                Loading model...
              </div>
            )}
            {importStatus === 'error' && (
              <div className="flex items-start gap-2 text-xs text-red-400 p-2 bg-red-500/10 rounded-lg">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
