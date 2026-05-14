'use client'

import React, { useState } from 'react'
import { useExperienceStore, type UIPanel } from '@/store/experience-store'
import {
  PanelTop,
  MessageSquare,
  LayoutDashboard,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
} from 'lucide-react'

export function UIPanelBuilder() {
  const { uiPanels, addUIPanel, updateUIPanel, removeUIPanel } = useExperienceStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = (type: UIPanel['type']) => {
    const id = `panel_${Date.now()}`
    addUIPanel({
      id,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Panel`,
      content: 'Enter your content here...',
      visible: true,
    })
    setEditingId(id)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          UI Panels
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => handleAdd('modal')}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Add Modal"
          >
            <PanelTop size={14} />
          </button>
          <button
            onClick={() => handleAdd('sidebar')}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Add Sidebar"
          >
            <LayoutDashboard size={14} />
          </button>
          <button
            onClick={() => handleAdd('toast')}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Add Toast"
          >
            <MessageSquare size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {uiPanels.length === 0 ? (
          <div className="p-4 text-center">
            <PanelTop size={24} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 mb-3">No UI panels defined</p>
            <p className="text-[10px] text-slate-600">
              Create panels that behaviors can show/hide during interactions
            </p>
          </div>
        ) : (
          <div className="py-1 space-y-1">
            {uiPanels.map((panel) => (
              <PanelItem
                key={panel.id}
                panel={panel}
                isEditing={editingId === panel.id}
                onStartEdit={() => setEditingId(panel.id)}
                onStopEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PanelItem({
  panel,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  panel: UIPanel
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
}) {
  const { updateUIPanel, removeUIPanel } = useExperienceStore()
  const [title, setTitle] = useState(panel.title)
  const [content, setContent] = useState(panel.content)

  // Sync state with props when panel data changes externally
  React.useEffect(() => {
    setTitle(panel.title)
    setContent(panel.content)
  }, [panel.title, panel.content])

  const typeColors = {
    modal: 'text-blue-400 bg-blue-400/10',
    sidebar: 'text-purple-400 bg-purple-400/10',
    toast: 'text-amber-400 bg-amber-400/10',
  }

  const typeIcons = {
    modal: <PanelTop size={12} />,
    sidebar: <LayoutDashboard size={12} />,
    toast: <MessageSquare size={12} />,
  }

  const handleSave = () => {
    updateUIPanel(panel.id, { title, content })
    onStopEdit()
  }

  return (
    <div className="px-3 py-2 border-b border-white/5">
      <div className="flex items-center gap-2">
        <span className={`p-1 rounded ${typeColors[panel.type]}`}>
          {typeIcons[panel.type]}
        </span>

        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 px-1.5 py-0.5 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-xs font-medium text-slate-300 truncate">
            {panel.title}
          </span>
        )}

        <span className={`text-[9px] px-1.5 py-0.5 rounded ${typeColors[panel.type]}`}>
          {panel.type}
        </span>

        <div className="flex items-center gap-0.5">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="p-0.5 rounded hover:bg-emerald-500/20 text-emerald-400">
                <Check size={11} />
              </button>
              <button onClick={onStopEdit} className="p-0.5 rounded hover:bg-white/10 text-slate-400">
                <X size={11} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStartEdit}
                className="p-0.5 rounded hover:bg-white/10 text-slate-400 opacity-0 group-hover:opacity-100"
                style={{ opacity: 1 }}
              >
                <Edit3 size={11} />
              </button>
              <button
                onClick={() => removeUIPanel(panel.id)}
                className="p-0.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
              >
                <Trash2 size={11} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Panel ID reference */}
      <div className="mt-1 ml-6 flex items-center gap-1">
        <span className="text-[9px] text-slate-600">ID:</span>
        <code className="text-[9px] text-emerald-400/60 bg-slate-800/50 px-1 rounded">
          {panel.id}
        </code>
      </div>

      {/* Content editor */}
      {isEditing && (
        <div className="mt-2 ml-6">
          <label className="text-[9px] text-slate-500 uppercase tracking-wider">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none focus:border-emerald-500/50 resize-none"
            placeholder="Panel content or HTML..."
          />
        </div>
      )}
    </div>
  )
}
