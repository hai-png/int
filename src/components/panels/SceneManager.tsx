'use client'

import React, { useState } from 'react'
import { useExperienceStore, type SceneConfig } from '@/store/experience-store'
import {
  Plus,
  Trash2,
  ChevronRight,
  Film,
  Pencil,
  Check,
  X,
} from 'lucide-react'

let sceneCounter = 0
const uid = () => `scene_${Date.now()}_${++sceneCounter}`

export function SceneManager() {
  const {
    scenes,
    activeSceneId,
    addScene,
    removeScene,
    switchScene,
    updateScene,
  } = useExperienceStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAddScene = () => {
    const id = uid()
    addScene({
      id,
      name: `Scene ${scenes.length + 1}`,
      model: null,
      hotspots: [],
      environment: { type: 'hdri', preset: 'studio', intensity: 1.0 },
      cameraBookmarks: [],
    })
  }

  const handleStartEdit = (scene: SceneConfig) => {
    setEditingId(scene.id)
    setEditName(scene.name)
  }

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      updateScene(id, { name: editName.trim() })
    }
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Scenes
        </h3>
        <button
          onClick={handleAddScene}
          className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {scenes.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Film size={24} className="mx-auto text-slate-600 mb-2" />
            <p className="text-[10px] text-slate-600">No scenes yet</p>
            <button
              onClick={handleAddScene}
              className="text-[10px] text-emerald-400 mt-2 hover:text-emerald-300"
            >
              + Create first scene
            </button>
          </div>
        ) : (
          <div className="py-1">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className={`
                  group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-l-2
                  ${activeSceneId === scene.id
                    ? 'bg-emerald-500/10 border-emerald-500 text-slate-200'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-300'
                  }
                `}
                onClick={() => switchScene(scene.id)}
              >
                <div className={`
                  w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0
                  ${activeSceneId === scene.id
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800/50 text-slate-500'
                  }
                `}>
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === scene.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(scene.id)
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        className="flex-1 px-1.5 py-0.5 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(scene.id)} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                        <Check size={12} />
                      </button>
                      <button onClick={handleCancelEdit} className="p-0.5 text-slate-500 hover:text-slate-300">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium truncate">{scene.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(scene) }}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all"
                      >
                        <Pencil size={10} />
                      </button>
                    </div>
                  )}
                  <div className="text-[9px] text-slate-600 flex items-center gap-2">
                    <span>{scene.hotspots?.length || 0} spots</span>
                    <span>{scene.model ? '📦 Model' : '⚪ Demo'}</span>
                  </div>
                </div>

                {activeSceneId === scene.id && (
                  <ChevronRight size={12} className="text-emerald-500 shrink-0" />
                )}

                {scenes.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeScene(scene.id) }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all shrink-0"
                    title="Remove scene"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scene info footer */}
      {activeSceneId && (
        <div className="px-3 py-2 border-t border-white/5 text-[9px] text-slate-600">
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''} · Active: {scenes.find(s => s.id === activeSceneId)?.name || 'None'}
        </div>
      )}
    </div>
  )
}
