'use client'

import React from 'react'
import { useExperienceStore, type Hotspot, type HotspotType } from '@/store/experience-store'
import {
  Plus,
  Trash2,
  MapPin,
  Eye,
  EyeOff,
  Crosshair,
  Monitor,
  Box,
  Copy,
} from 'lucide-react'

export function HotspotPanel() {
  const {
    hotspots,
    selectedHotspotId,
    selectHotspot,
    addHotspot,
    removeHotspot,
    updateHotspot,
    duplicateHotspot,
    setAddingHotspot,
    theme,
  } = useExperienceStore()

  const handleAddHotspot = (type: HotspotType) => {
    setAddingHotspot(true, type)
  }

  const handleAddHotspotManual = (type: HotspotType) => {
    const id = `hs_${Date.now()}`
    addHotspot({
      id,
      name: `Hotspot ${hotspots.length + 1}`,
      type,
      position: [0, 1, 0],
      icon: '📍',
      label: `Hotspot ${hotspots.length + 1}`,
      behaviors: [],
      visible: true,
      pulseAnimation: theme.hotspotPulseAnimation,
    })
    selectHotspot(id)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Hotspots
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => handleAddHotspotManual('3D')}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Add 3D Hotspot"
          >
            <Box size={14} />
          </button>
          <button
            onClick={() => handleAddHotspotManual('2D')}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Add 2D Hotspot"
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => handleAddHotspot('3D')}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Place on Scene"
          >
            <Crosshair size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {hotspots.length === 0 ? (
          <div className="p-4 text-center">
            <MapPin size={24} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 mb-3">No hotspots yet</p>
            <button
              onClick={() => handleAddHotspotManual('3D')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mx-auto"
            >
              <Plus size={12} /> Add First Hotspot
            </button>
          </div>
        ) : (
          <div className="py-1">
            {hotspots.map((hotspot) => (
              <HotspotItem
                key={hotspot.id}
                hotspot={hotspot}
                isSelected={selectedHotspotId === hotspot.id}
                onSelect={() => selectHotspot(hotspot.id)}
                onToggleVisibility={() =>
                  updateHotspot(hotspot.id, { visible: !hotspot.visible })
                }
                onRemove={() => removeHotspot(hotspot.id)}
                onDuplicate={() => duplicateHotspot(hotspot.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HotspotItem({
  hotspot,
  isSelected,
  onSelect,
  onToggleVisibility,
  onRemove,
  onDuplicate,
}: {
  hotspot: Hotspot
  isSelected: boolean
  onSelect: () => void
  onToggleVisibility: () => void
  onRemove: () => void
  onDuplicate: () => void
}) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer group transition-colors
        ${isSelected ? 'bg-emerald-500/15 border-l-2 border-emerald-500' : 'hover:bg-white/5 border-l-2 border-transparent'}
      `}
      onClick={onSelect}
    >
      <span className="text-sm">{hotspot.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-300 truncate">
          {hotspot.name}
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              hotspot.type === '3D' ? 'bg-blue-400' : 'bg-orange-400'
            }`}
          />
          {hotspot.type}
          <span>·</span>
          <span>{hotspot.behaviors.length} behaviors</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate()
          }}
          className="p-1 rounded hover:bg-white/10 text-slate-400"
          title="Duplicate"
        >
          <Copy size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility()
          }}
          className="p-1 rounded hover:bg-white/10 text-slate-400"
        >
          {hotspot.visible ? <Eye size={11} /> : <EyeOff size={11} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}
