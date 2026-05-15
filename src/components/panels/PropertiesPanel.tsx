'use client'

import React, { useState, useMemo } from 'react'
import { useExperienceStore, type Hotspot, type Behavior, type ActionDef, type TriggerType, type SceneNode, type LightConfig, type Annotation } from '@/store/experience-store'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Camera,
  Move,
  Eye,
  EyeOff,
  Layers,
  Palette,
  Sun,
  Film,
  PanelTop,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Box,
  Lightbulb,
  RotateCcw,
  Maximize,
  Settings,
  Monitor,
  Aperture,
  Sparkles,
  MapPin,
  Crosshair,
  MessageCircle,
} from 'lucide-react'
import { HexColorPicker } from 'react-colorful'

// ─── Reusable Vec3 Input ─────────────────────────────────

function Vec3Input({
  label,
  prefixes,
  value,
  onChange,
  step = 0.1,
}: {
  label: string
  prefixes: [string, string, string]
  value: [number, number, number]
  onChange: (v: [number, number, number]) => void
  step?: number
}) {
  return (
    <div>
      <label className="text-[9px] text-slate-500">{label}</label>
      <div className="grid grid-cols-3 gap-1 mt-0.5">
        {prefixes.map((prefix, i) => (
          <div key={prefix}>
            <div className={`text-[8px] mb-0.5 font-medium ${i === 0 ? 'text-red-400/60' : i === 1 ? 'text-green-400/60' : 'text-blue-400/60'}`}>{prefix}</div>
            <input
              type="number"
              step={step}
              value={value[i]}
              onChange={(e) => {
                const next: [number, number, number] = [...value]
                next[i] = parseFloat(e.target.value) || 0
                onChange(next)
              }}
              className="w-full px-1 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Action type config ───────────────────────────────────

const actionTypes = [
  { type: 'camera', label: 'Camera', icon: <Camera size={14} />, color: 'text-blue-400' },
  { type: 'transform', label: 'Transform', icon: <Move size={14} />, color: 'text-green-400' },
  { type: 'visibility', label: 'Visibility', icon: <Eye size={14} />, color: 'text-yellow-400' },
  { type: 'variant', label: 'Variant', icon: <Layers size={14} />, color: 'text-purple-400' },
  { type: 'material', label: 'Material', icon: <Palette size={14} />, color: 'text-pink-400' },
  { type: 'lighting', label: 'Lighting', icon: <Sun size={14} />, color: 'text-amber-400' },
  { type: 'animation', label: 'Animation', icon: <Film size={14} />, color: 'text-cyan-400' },
  { type: 'ui', label: 'UI Panel', icon: <PanelTop size={14} />, color: 'text-rose-400' },
] as const

const triggerTypes: { value: TriggerType; label: string }[] = [
  { value: 'onClick', label: 'On Click' },
  { value: 'onHover', label: 'On Hover' },
  { value: 'onProximity', label: 'On Proximity' },
]

let actionCounter = 0
const uid = () => `act_${Date.now()}_${++actionCounter}`

// ─── Sortable Behavior Block ──────────────────────────────

function SortableBehaviorBlock({
  hotspotId,
  behavior,
}: {
  hotspotId: string
  behavior: Behavior
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: behavior.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <BehaviorBlockInner hotspotId={hotspotId} behavior={behavior} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  )
}

function BehaviorBlockInner({
  hotspotId,
  behavior,
  dragListeners,
  dragAttributes,
}: {
  hotspotId: string
  behavior: Behavior
  dragListeners?: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes?: any
}) {
  const { updateBehavior, removeBehavior, addAction, reorderActions } =
    useExperienceStore()
  const [expanded, setExpanded] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleAddAction = () => {
    addAction(hotspotId, behavior.id, {
      id: uid(),
      type: 'camera',
      action: 'focusOn',
      target: '',
      duration: 1000,
      easing: 'easeInOut',
    })
  }

  const handleActionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const currentIds = behavior.actions.map((a) => a.id)
    const oldIndex = currentIds.indexOf(active.id as string)
    const newIndex = currentIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const newIds = arrayMove(currentIds, oldIndex, newIndex)
    reorderActions(hotspotId, behavior.id, newIds)
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div {...dragAttributes} {...dragListeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={12} className="text-slate-600" />
        </div>
        <select
          value={behavior.trigger}
          onChange={(e) =>
            updateBehavior(hotspotId, behavior.id, {
              trigger: e.target.value as TriggerType,
            })
          }
          className="text-[10px] bg-slate-700 border border-white/10 rounded px-1.5 py-0.5 text-emerald-400 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {triggerTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-slate-500 flex-1">
          {behavior.actions.length} action{behavior.actions.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            removeBehavior(hotspotId, behavior.id)
          }}
          className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
        >
          <Trash2 size={10} />
        </button>
        <ChevronDown
          size={12}
          className={`text-slate-500 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
      </div>

      {/* Actions list with drag-to-reorder */}
      {expanded && (
        <div className="p-2 space-y-1.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleActionDragEnd}
          >
            <SortableContext
              items={behavior.actions.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {behavior.actions.map((action) => (
                <SortableActionBlock
                  key={action.id}
                  hotspotId={hotspotId}
                  behaviorId={behavior.id}
                  action={action}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add action button */}
          <button
            onClick={handleAddAction}
            className="w-full py-1.5 border border-dashed border-white/10 rounded text-[10px] text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={10} /> Add Action
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sortable Action Block ────────────────────────────────

function SortableActionBlock({
  hotspotId,
  behaviorId,
  action,
}: {
  hotspotId: string
  behaviorId: string
  action: ActionDef
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ActionBlock
        hotspotId={hotspotId}
        behaviorId={behaviorId}
        action={action}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  )
}

// ─── Main Properties Panel ────────────────────────────────

export function PropertiesPanel() {
  const {
    hotspots,
    selectedHotspotId,
    selectedNodeId,
    sceneNodes,
    model,
    camera,
    setCamera,
    lights,
    updateHotspot,
    addBehavior,
    updateBehavior,
    removeBehavior,
    reorderBehaviors,
    addAction,
    updateAction,
    removeAction,
    updateLight,
    annotations,
    selectedAnnotationId,
    updateAnnotation,
    removeAnnotation,
    selectAnnotation,
  } = useExperienceStore()

  const selectedHotspot = hotspots.find((h) => h.id === selectedHotspotId)
  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId)

  // Find the selected scene node by traversing the tree
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || sceneNodes.length === 0) return null
    function findNode(nodes: SceneNode[], id: string): SceneNode | null {
      for (const n of nodes) {
        if (n.id === id) return n
        if (n.children) {
          const found = findNode(n.children, id)
          if (found) return found
        }
      }
      return null
    }
    return findNode(sceneNodes, selectedNodeId)
  }, [selectedNodeId, sceneNodes])

  // Find matching light if a light node is selected
  const selectedLight = React.useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'light') return null
    return lights.find((l) => l.id === selectedNode.id) || null
  }, [selectedNode, lights])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleBehaviorDragEnd = (event: DragEndEvent) => {
    if (!selectedHotspot) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const currentIds = selectedHotspot.behaviors.map((b) => b.id)
    const oldIndex = currentIds.indexOf(active.id as string)
    const newIndex = currentIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const newIds = arrayMove(currentIds, oldIndex, newIndex)
    reorderBehaviors(selectedHotspot.id, newIds)
  }

  // If a hotspot is selected, show hotspot properties
  if (selectedHotspot) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
            <MapPin size={11} className="text-emerald-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 tracking-wide">
            Hotspot Properties
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <HotspotInfoSection hotspot={selectedHotspot} />
          <PositionSection hotspot={selectedHotspot} />
          <VisibilitySection hotspot={selectedHotspot} />
          <BehaviorsSection hotspot={selectedHotspot} sensors={sensors} onBehaviorDragEnd={handleBehaviorDragEnd} />
        </div>
      </div>
    )
  }

  // If a light node is selected, show light properties
  if (selectedLight) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-yellow-500/20 flex items-center justify-center">
            <Lightbulb size={11} className="text-yellow-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 tracking-wide">
            Light Properties
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <LightPropertiesSection light={selectedLight} />
        </div>
      </div>
    )
  }

  // If a scene node is selected (but no hotspot/light), show node properties
  if (selectedNode) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
            <Box size={11} className="text-blue-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 tracking-wide">
            Node Properties
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <SceneNodePropertiesSection node={selectedNode} />
        </div>
      </div>
    )
  }

  // If an annotation is selected, show annotation editing
  if (selectedAnnotation) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
            <MessageCircle size={11} className="text-emerald-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 tracking-wide">
            Annotation Properties
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnnotationPropertiesSection annotation={selectedAnnotation} />
        </div>
      </div>
    )
  }

  // Default: show model + camera overview
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center">
          <Settings size={11} className="text-slate-400" />
        </div>
        <h3 className="text-xs font-semibold text-slate-300 tracking-wide">
          Scene Properties
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {model && <ModelPropertiesSection />}
        <CameraPropertiesSection camera={camera} setCamera={setCamera} />
        <SceneOverviewSection />
      </div>
    </div>
  )
}

// ─── Hotspot Info Section ─────────────────────────────────

function HotspotInfoSection({ hotspot }: { hotspot: Hotspot }) {
  const { updateHotspot } = useExperienceStore()

  return (
    <div className="px-3 py-3 border-b border-white/5 space-y-2">
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
        <input
          type="text"
          value={hotspot.name}
          onChange={(e) => updateHotspot(hotspot.id, { name: e.target.value })}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Type</label>
          <select
            value={hotspot.type}
            onChange={(e) => updateHotspot(hotspot.id, { type: e.target.value as '2D' | '3D' })}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="3D">3D World</option>
            <option value="2D">2D Screen</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Icon</label>
          <input
            type="text"
            value={hotspot.icon}
            onChange={(e) => updateHotspot(hotspot.id, { icon: e.target.value })}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>
      {/* Type-specific badge */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50">
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${hotspot.type === '2D' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {hotspot.type === '2D' ? '2D' : '3D'}
        </span>
        <span className="text-[9px] text-slate-500">
          {hotspot.type === '2D' ? 'Fixed screen position (% offsets)' : 'World-space position (XYZ)'}
        </span>
      </div>
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Label</label>
        <input
          type="text"
          value={hotspot.label}
          onChange={(e) => updateHotspot(hotspot.id, { label: e.target.value })}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={hotspot.pulseAnimation}
            onChange={(e) => updateHotspot(hotspot.id, { pulseAnimation: e.target.checked })}
            className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-[10px] text-slate-400">Pulse Animation</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={hotspot.visible}
            onChange={(e) => updateHotspot(hotspot.id, { visible: e.target.checked })}
            className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-[10px] text-slate-400">Visible</span>
        </label>
      </div>
      {hotspot.attachedTo && (
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Attached To</label>
          <div className="mt-0.5 px-2 py-1 text-xs bg-slate-800/50 border border-white/5 rounded text-slate-400">
            {hotspot.attachedTo}
          </div>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-[9px] text-slate-500">Attach to mesh</label>
        <input
          type="text"
          value={hotspot.attachedTo || ''}
          onChange={(e) => updateHotspot(hotspot.id, { attachedTo: e.target.value || undefined })}
          placeholder="Type mesh name..."
          className="w-full px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  )
}

// ─── Position Section ─────────────────────────────────────

function PositionSection({ hotspot }: { hotspot: Hotspot }) {
  const { updateHotspot } = useExperienceStore()

  // 2D hotspots use screen-space offset [x%, y%]
  if (hotspot.type === '2D') {
    const offsetX = hotspot.offset?.[0] ?? 50
    const offsetY = hotspot.offset?.[1] ?? 50

    const updateOffset = (axis: number, val: number) => {
      const newOffset: [number, number, number] = [
        axis === 0 ? val : (hotspot.offset?.[0] ?? 50),
        axis === 1 ? val : (hotspot.offset?.[1] ?? 50),
        hotspot.offset?.[2] ?? 0,
      ]
      updateHotspot(hotspot.id, { offset: newOffset })
    }

    return (
      <div className="px-3 py-3 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-2">
          <Monitor size={11} className="text-amber-400" />
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Screen Position</label>
          <span className="text-[9px] text-amber-400/70">%</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[9px] text-slate-600 mb-0.5">X (%)</div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={offsetX}
              onChange={(e) => updateOffset(0, parseInt(e.target.value) || 0)}
              className="w-full h-1.5 appearance-none bg-slate-700 rounded accent-amber-500"
            />
            <div className="text-[9px] text-slate-500 text-center mt-0.5">{offsetX}%</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 mb-0.5">Y (%)</div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={offsetY}
              onChange={(e) => updateOffset(1, parseInt(e.target.value) || 0)}
              className="w-full h-1.5 appearance-none bg-slate-700 rounded accent-amber-500"
            />
            <div className="text-[9px] text-slate-500 text-center mt-0.5">{offsetY}%</div>
          </div>
        </div>
      </div>
    )
  }

  // 3D hotspots use world-space X, Y, Z
  const updatePos = (axis: number, val: number) => {
    const newPos: [number, number, number] = [...hotspot.position]
    newPos[axis] = val
    updateHotspot(hotspot.id, { position: newPos })
  }

  return (
    <div className="px-3 py-3 border-b border-white/5">
      <div className="flex items-center gap-1.5 mb-2">
        <Crosshair size={11} className="text-emerald-400" />
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Position</label>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis}>
            <div className={`text-[9px] mb-0.5 font-medium ${i === 0 ? 'text-red-400/60' : i === 1 ? 'text-green-400/60' : 'text-blue-400/60'}`}>{axis}</div>
            <input
              type="number"
              step={0.1}
              value={hotspot.position[i]}
              onChange={(e) => updatePos(i, parseFloat(e.target.value) || 0)}
              className="w-full px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Visibility Section ──────────────────────────────────

function VisibilitySection({ hotspot }: { hotspot: Hotspot }) {
  const { updateHotspot } = useExperienceStore()

  return (
    <div className="px-3 py-2 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {hotspot.visible ? (
            <Eye size={12} className="text-emerald-400" />
          ) : (
            <EyeOff size={12} className="text-red-400" />
          )}
          <span className="text-[10px] text-slate-400">
            {hotspot.visible ? 'Visible in scene' : 'Hidden from scene'}
          </span>
        </div>
        <button
          onClick={() => updateHotspot(hotspot.id, { visible: !hotspot.visible })}
          className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
            hotspot.visible
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-white/5'
              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
          }`}
        >
          {hotspot.visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}

// ─── Behaviors Section (with DnD) ─────────────────────────

function BehaviorsSection({
  hotspot,
  sensors,
  onBehaviorDragEnd,
}: {
  hotspot: Hotspot
  sensors: ReturnType<typeof useSensors>
  onBehaviorDragEnd: (event: DragEndEvent) => void
}) {
  const { addBehavior } = useExperienceStore()

  const handleAddBehavior = () => {
    addBehavior(hotspot.id, {
      id: `beh_${Date.now()}`,
      trigger: 'onClick',
      actions: [],
    })
  }

  return (
    <div className="px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={10} className="text-emerald-400" />
          Behaviors
        </label>
        <button
          onClick={handleAddBehavior}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
        >
          <Plus size={10} /> Add
        </button>
      </div>

      {hotspot.behaviors.length === 0 ? (
        <div className="text-center py-4 border border-dashed border-white/10 rounded-lg">
          <p className="text-[10px] text-slate-600">No behaviors configured</p>
          <button
            onClick={handleAddBehavior}
            className="text-[10px] text-emerald-400 mt-1 hover:text-emerald-300"
          >
            + Add Behavior
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onBehaviorDragEnd}
        >
          <SortableContext
            items={hotspot.behaviors.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {hotspot.behaviors.map((behavior) => (
                <SortableBehaviorBlock
                  key={behavior.id}
                  hotspotId={hotspot.id}
                  behavior={behavior}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

// ─── Action Block ─────────────────────────────────────────

function ActionBlock({
  hotspotId,
  behaviorId,
  action,
  dragAttributes,
  dragListeners,
}: {
  hotspotId: string
  behaviorId: string
  action: ActionDef
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes?: any
  dragListeners?: Record<string, unknown>
}) {
  const { updateAction, removeAction } = useExperienceStore()
  const actionConfig = actionTypes.find((a) => a.type === action.type)

  const handleChangeType = (newType: string) => {
    const defaults: Record<string, Partial<ActionDef>> = {
      camera: { action: 'focusOn', target: '', duration: 1000, easing: 'easeInOut' },
      transform: { target: '', translate: [0, 0, 0], rotate: [0, 0, 0], scale: [1, 1, 1], duration: 500 },
      visibility: { target: '', visibilityAction: 'toggle' },
      variant: { variantName: '', affects: {} },
      material: { target: '', property: 'color', value: '#ffffff' },
      lighting: { action: 'changeEnvironment', intensity: 1.0 },
      animation: { action: 'play', animationName: '', loop: false, speed: 1.0 },
      ui: { action: 'showPanel', panelId: '', content: '' },
    }
    updateAction(hotspotId, behaviorId, action.id, {
      type: newType as ActionDef['type'],
      ...defaults[newType],
    })
  }

  return (
    <div className="border border-white/5 rounded bg-slate-800/30 p-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div {...dragAttributes} {...dragListeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={10} className="text-slate-600" />
        </div>
        <span className={actionConfig?.color || 'text-slate-400'}>
          {actionConfig?.icon}
        </span>
        <select
          value={action.type}
          onChange={(e) => handleChangeType(e.target.value)}
          className="text-[10px] bg-slate-700 border border-white/10 rounded px-1 py-0.5 text-slate-300 flex-1 focus:outline-none"
        >
          {actionTypes.map((a) => (
            <option key={a.type} value={a.type}>
              {a.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => removeAction(hotspotId, behaviorId, action.id)}
          className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
        >
          <X size={10} />
        </button>
      </div>

      {/* Action-specific fields */}
      <ActionFields
        hotspotId={hotspotId}
        behaviorId={behaviorId}
        action={action}
      />
    </div>
  )
}

// ─── Action Fields (dynamic based on type) ────────────────

function ActionFields({
  hotspotId,
  behaviorId,
  action,
}: {
  hotspotId: string
  behaviorId: string
  action: ActionDef
}) {
  const { updateAction } = useExperienceStore()
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Hooks that must be called unconditionally (React rules-of-hooks)
  const uiPanels = useExperienceStore((s) => s.uiPanels)
  const variables = useExperienceStore((s) => s.variables)
  const animationClips = useMemo(() => {
    const clips = (globalThis as Record<string, unknown>).__animationClips
    return Array.isArray(clips) ? clips as string[] : []
  }, [])

  const update = (updates: Partial<ActionDef>) => {
    updateAction(hotspotId, behaviorId, action.id, updates)
  }

  // Common: target
  const targetField = (
    <div className="mb-1">
      <label className="text-[9px] text-slate-500">Target</label>
      <input
        type="text"
        value={action.target || ''}
        onChange={(e) => update({ target: e.target.value })}
        placeholder="mesh name"
        className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
      />
    </div>
  )

  // Common: duration
  const durationField = (
    <div>
      <label className="text-[9px] text-slate-500">Duration (ms)</label>
      <input
        type="number"
        value={action.duration || 0}
        onChange={(e) => update({ duration: parseInt(e.target.value) || 0 })}
        className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
      />
    </div>
  )

  switch (action.type) {
    case 'camera':
      return (
        <div className="space-y-1">
          {targetField}
          <div>
            <label className="text-[9px] text-slate-500">Action</label>
            <select
              value={action.action || 'focusOn'}
              onChange={(e) => update({ action: e.target.value })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            >
              <option value="focusOn">Focus On</option>
              <option value="moveTo">Move To</option>
              <option value="flyTo">Fly To</option>
              <option value="orbit">Orbit</option>
            </select>
          </div>
          {(action.action === 'moveTo' || action.action === 'flyTo') && (
            <>
              <Vec3Input
                label="Position"
                prefixes={['PX', 'PY', 'PZ']}
                value={action.position || [0, 0, 0]}
                onChange={(v) => update({ position: v })}
              />
              <Vec3Input
                label="Look At"
                prefixes={['LX', 'LY', 'LZ']}
                value={action.lookAt || [0, 0, 0]}
                onChange={(v) => update({ lookAt: v })}
              />
            </>
          )}
          {action.action === 'orbit' && (
            <Vec3Input
              label="Offset"
              prefixes={['OX', 'OY', 'OZ']}
              value={action.offset || [0, 2, 5]}
              onChange={(v) => update({ offset: v })}
            />
          )}
          {durationField}
          <div>
            <label className="text-[9px] text-slate-500">Easing</label>
            <select
              value={action.easing || 'easeInOut'}
              onChange={(e) => update({ easing: e.target.value })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            >
              <option value="linear">Linear</option>
              <option value="easeIn">Ease In</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeInOut">Ease In Out</option>
            </select>
          </div>
        </div>
      )

    case 'transform':
      return (
        <div className="space-y-1">
          {targetField}
          <Vec3Input
            label="Translate"
            prefixes={['TX', 'TY', 'TZ']}
            value={action.translate || [0, 0, 0]}
            onChange={(v) => update({ translate: v })}
          />
          <Vec3Input
            label="Rotate"
            prefixes={['RX', 'RY', 'RZ']}
            value={action.rotate || [0, 0, 0]}
            onChange={(v) => update({ rotate: v })}
          />
          <Vec3Input
            label="Scale"
            prefixes={['SX', 'SY', 'SZ']}
            value={action.scale || [1, 1, 1]}
            onChange={(v) => update({ scale: v })}
          />
          {durationField}
        </div>
      )

    case 'visibility':
      return (
        <div className="space-y-1">
          {targetField}
          <div>
            <label className="text-[9px] text-slate-500">Action</label>
            <select
              value={action.visibilityAction || 'toggle'}
              onChange={(e) => update({ visibilityAction: e.target.value as 'show' | 'hide' | 'toggle' })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            >
              <option value="show">Show</option>
              <option value="hide">Hide</option>
              <option value="toggle">Toggle</option>
            </select>
          </div>
        </div>
      )

    case 'variant':
      return (
        <div className="space-y-1">
          <div>
            <label className="text-[9px] text-slate-500">Variant Name</label>
            <input
              type="text"
              value={action.variantName || ''}
              onChange={(e) => update({ variantName: e.target.value })}
              placeholder="e.g. color_red"
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500">Affects — Materials</label>
            <input
              type="text"
              value={(action.affects?.materials || []).join(', ')}
              onChange={(e) => {
                const materials = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                update({ affects: { ...action.affects, materials } })
              }}
              placeholder="mat1, mat2, mat3"
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500">Affects — Meshes</label>
            <input
              type="text"
              value={(action.affects?.meshes || []).join(', ')}
              onChange={(e) => {
                const meshes = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                update({ affects: { ...action.affects, meshes } })
              }}
              placeholder="mesh1, mesh2, mesh3"
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 flex items-center gap-1">
              Condition
              <span className="text-[8px] text-slate-600 cursor-help" title="e.g. variable:myVar > 5, variable:isOpen === true">?</span>
            </label>
            <input
              type="text"
              value={action.condition || ''}
              onChange={(e) => update({ condition: e.target.value })}
              placeholder="e.g. variable:myVar > 5"
              className="w-full px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )

    case 'material':
      return (
        <div className="space-y-1">
          {targetField}
          <div>
            <label className="text-[9px] text-slate-500">Property</label>
            <select
              value={action.property || 'color'}
              onChange={(e) => update({ property: e.target.value })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            >
              <option value="color">Color</option>
              <option value="metalness">Metalness</option>
              <option value="roughness">Roughness</option>
              <option value="opacity">Opacity</option>
            </select>
          </div>
          {action.property === 'color' ? (
            <div>
              <label className="text-[9px] text-slate-500">Color</label>
              <div className="flex items-center gap-1 mt-0.5">
                <div
                  className="w-5 h-5 rounded border border-white/20 cursor-pointer"
                  style={{ backgroundColor: String(action.value || '#ffffff') }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <input
                  type="text"
                  value={String(action.value || '#ffffff')}
                  onChange={(e) => update({ value: e.target.value })}
                  className="flex-1 px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
                />
              </div>
              {showColorPicker && (
                <div className="mt-1 relative">
                  <HexColorPicker
                    color={String(action.value || '#ffffff')}
                    onChange={(color) => update({ value: color })}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[9px] text-slate-500">Value</label>
              <input
                type="number"
                step={0.1}
                min={0}
                max={1}
                value={Number(action.value) || 0}
                onChange={(e) => update({ value: parseFloat(e.target.value) || 0 })}
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
              />
            </div>
          )}
        </div>
      )

    case 'lighting':
      return (
        <div className="space-y-1">
          <div>
            <label className="text-[9px] text-slate-500">Action</label>
            <select
              value={action.action || 'changeEnvironment'}
              onChange={(e) => update({ action: e.target.value })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            >
              <option value="changeEnvironment">Change Environment</option>
              <option value="modifyLight">Modify Light</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] text-slate-500">Intensity</label>
            <input
              type="number"
              step={0.1}
              value={action.intensity || 1.0}
              onChange={(e) => update({ intensity: parseFloat(e.target.value) || 1.0 })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            />
          </div>
          {action.action === 'changeEnvironment' && (
            <div>
              <label className="text-[9px] text-slate-500">HDRI</label>
              <input
                type="text"
                value={action.hdri || ''}
                onChange={(e) => update({ hdri: e.target.value })}
                placeholder="e.g. sunset, studio, urban"
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          )}
          {action.action === 'modifyLight' && (
            <>
              <div>
                <label className="text-[9px] text-slate-500">Light Name</label>
                <input
                  type="text"
                  value={action.lightName || ''}
                  onChange={(e) => update({ lightName: e.target.value })}
                  placeholder="e.g. keyLight"
                  className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-500">Color</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <div
                    className="w-5 h-5 rounded border border-white/20 cursor-pointer flex-shrink-0"
                    style={{ backgroundColor: action.color || '#ffffff' }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  <input
                    type="text"
                    value={action.color || '#ffffff'}
                    onChange={(e) => update({ color: e.target.value })}
                    className="flex-1 px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
                  />
                </div>
                {showColorPicker && (
                  <div className="mt-1 relative">
                    <HexColorPicker
                      color={action.color || '#ffffff'}
                      onChange={(color) => update({ color })}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-[9px] text-slate-500">Target</label>
                <input
                  type="text"
                  value={action.target || ''}
                  onChange={(e) => update({ target: e.target.value })}
                  placeholder="mesh or node name"
                  className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </>
          )}
        </div>
      )

    case 'animation': {
      return (
        <div className="space-y-1">
          <div>
            <label className="text-[9px] text-slate-500">Animation Name</label>
            {animationClips.length > 0 ? (
              <select
                value={action.animationName || ''}
                onChange={(e) => update({ animationName: e.target.value })}
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
              >
                <option value="">Select animation...</option>
                {animationClips.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={action.animationName || ''}
                onChange={(e) => update({ animationName: e.target.value })}
                placeholder="e.g. door_open"
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
              />
            )}
          </div>
          <div>
            <label className="text-[9px] text-slate-500">Action</label>
            <select
              value={action.action || 'play'}
              onChange={(e) => update({ action: e.target.value })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            >
              <option value="play">Play</option>
              <option value="pause">Pause</option>
              <option value="stop">Stop</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={action.loop || false}
                onChange={(e) => update({ loop: e.target.checked })}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500"
              />
              <span className="text-[9px] text-slate-400">Loop</span>
            </label>
          </div>
          <div>
            <label className="text-[9px] text-slate-500">Speed</label>
            <input
              type="number"
              step={0.1}
              value={action.speed || 1.0}
              onChange={(e) => update({ speed: parseFloat(e.target.value) || 1.0 })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            />
          </div>
        </div>
      )
    }

    case 'ui': {
      return (
        <div className="space-y-1">
          <div>
            <label className="text-[9px] text-slate-500">Action</label>
            <select
              value={action.action || 'showPanel'}
              onChange={(e) => update({ action: e.target.value })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            >
              <option value="showPanel">Show Panel</option>
              <option value="hidePanel">Hide Panel</option>
              <option value="updateVariable">Update Variable</option>
            </select>
          </div>
          {action.action === 'updateVariable' ? (
            <div>
              <label className="text-[9px] text-slate-500">Variable</label>
              {variables.length > 0 ? (
                <select
                  value={action.variable || ''}
                  onChange={(e) => update({ variable: e.target.value })}
                  className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
                >
                  <option value="">Select variable...</option>
                  {variables.map((v) => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={action.variable || ''}
                  onChange={(e) => update({ variable: e.target.value })}
                  placeholder="Variable name"
                  className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
                />
              )}
            </div>
          ) : (
            <div>
              <label className="text-[9px] text-slate-500">Panel</label>
              <select
                value={action.panelId || ''}
                onChange={(e) => update({ panelId: e.target.value })}
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
              >
                <option value="">Select panel...</option>
                {uiPanels.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.type})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-[9px] text-slate-500">Content</label>
            <textarea
              value={action.content || ''}
              onChange={(e) => update({ content: e.target.value })}
              rows={2}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50 resize-none"
              placeholder={action.action === 'updateVariable' ? 'New value...' : 'Optional content...'}
            />
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Light Properties Section ──────────────────────────────

function LightPropertiesSection({ light }: { light: LightConfig }) {
  const { updateLight, removeLight } = useExperienceStore()

  return (
    <div className="px-3 py-3 space-y-3">
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <Sun size={14} className="text-yellow-400" />
        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-yellow-500/20 text-yellow-400 uppercase">
          {light.type}
        </span>
      </div>

      {/* Name */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
        <input
          type="text"
          value={light.name}
          onChange={(e) => updateLight(light.id, { name: e.target.value })}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Type selector */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Type</label>
        <select
          value={light.type}
          onChange={(e) => updateLight(light.id, { type: e.target.value as LightConfig['type'] })}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="ambient">Ambient</option>
          <option value="directional">Directional</option>
          <option value="point">Point</option>
          <option value="spot">Spot</option>
          <option value="hemisphere">Hemisphere</option>
        </select>
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Color</label>
        <div className="flex items-center gap-2 mt-0.5">
          <input
            type="color"
            value={light.color}
            onChange={(e) => updateLight(light.id, { color: e.target.value })}
            className="w-8 h-8 rounded border border-white/10 cursor-pointer"
          />
          <input
            type="text"
            value={light.color}
            onChange={(e) => updateLight(light.id, { color: e.target.value })}
            className="flex-1 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Intensity */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Intensity</label>
        <div className="flex items-center gap-2 mt-0.5">
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={light.intensity}
            onChange={(e) => updateLight(light.id, { intensity: parseFloat(e.target.value) || 0 })}
            className="flex-1"
          />
          <span className="text-[10px] text-slate-400 w-8 text-right">{light.intensity.toFixed(1)}</span>
        </div>
      </div>

      {/* Position (not for ambient) */}
      {light.type !== 'ambient' && (
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Position</label>
          <div className="grid grid-cols-3 gap-1.5 mt-0.5">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <div key={axis}>
                <div className={`text-[9px] mb-0.5 font-medium ${i === 0 ? 'text-red-400/60' : i === 1 ? 'text-green-400/60' : 'text-blue-400/60'}`}>{axis}</div>
                <input
                  type="number"
                  step={0.5}
                  value={light.position[i]}
                  onChange={(e) => {
                    const newPos: [number, number, number] = [...light.position]
                    newPos[i] = parseFloat(e.target.value) || 0
                    updateLight(light.id, { position: newPos })
                  }}
                  className="w-full px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cast shadow */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={light.castShadow}
          onChange={(e) => updateLight(light.id, { castShadow: e.target.checked })}
          className="rounded border-slate-600 bg-slate-800 text-emerald-500"
        />
        <span className="text-[10px] text-slate-400">Cast Shadow</span>
      </label>

      {/* Spot light specific */}
      {light.type === 'spot' && (
        <>
          <div>
            <label className="text-[9px] text-slate-500">Angle</label>
            <input
              type="range" min={0.1} max={1.57} step={0.05}
              value={light.angle || 0.5}
              onChange={(e) => updateLight(light.id, { angle: parseFloat(e.target.value) })}
              className="w-full"
            />
            <span className="text-[9px] text-slate-500">{(light.angle || 0.5).toFixed(2)}</span>
          </div>
          <div>
            <label className="text-[9px] text-slate-500">Penumbra</label>
            <input
              type="range" min={0} max={1} step={0.05}
              value={light.penumbra || 0}
              onChange={(e) => updateLight(light.id, { penumbra: parseFloat(e.target.value) })}
              className="w-full"
            />
            <span className="text-[9px] text-slate-500">{(light.penumbra || 0).toFixed(2)}</span>
          </div>
        </>
      )}

      {/* Delete button */}
      <button
        onClick={() => removeLight(light.id)}
        className="w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
      >
        <Trash2 size={12} /> Remove Light
      </button>
    </div>
  )
}

// ─── Scene Node Properties Section ──────────────────────────

function SceneNodePropertiesSection({ node }: { node: SceneNode }) {
  const { toggleNodeVisibility, selectNode } = useExperienceStore()
  const typeColors: Record<string, string> = {
    mesh: 'text-blue-400',
    light: 'text-yellow-400',
    camera: 'text-purple-400',
    material: 'text-pink-400',
    animation: 'text-orange-400',
    group: 'text-slate-400',
  }
  const typeLabels: Record<string, string> = {
    mesh: 'Mesh',
    light: 'Light',
    camera: 'Camera',
    material: 'Material',
    animation: 'Animation',
    group: 'Group',
  }
  const typeIcons: Record<string, React.ReactNode> = {
    mesh: <Box size={14} className="text-blue-400" />,
    light: <Lightbulb size={14} className="text-yellow-400" />,
    camera: <Camera size={14} className="text-purple-400" />,
    material: <Palette size={14} className="text-pink-400" />,
    animation: <Film size={14} className="text-orange-400" />,
    group: <Layers size={14} className="text-slate-400" />,
  }

  return (
    <div className="px-3 py-3 space-y-3">
      {/* Node type badge */}
      <div className="flex items-center gap-2">
        {typeIcons[node.type] || <Box size={14} className="text-slate-400" />}
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-800 ${typeColors[node.type] || 'text-slate-400'}`}>
          {typeLabels[node.type] || node.type}
        </span>
        {node.visible ? (
          <span className="text-[9px] text-emerald-400 flex items-center gap-0.5"><Eye size={10} /> Visible</span>
        ) : (
          <span className="text-[9px] text-red-400 flex items-center gap-0.5"><EyeOff size={10} /> Hidden</span>
        )}
      </div>

      {/* Node name */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
        <div className="mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300">
          {node.name}
        </div>
      </div>

      {/* Node ID */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-wider">ID</label>
        <div className="mt-0.5 px-2 py-1 text-[10px] bg-slate-800/50 border border-white/5 rounded text-slate-500 font-mono">
          {node.id}
        </div>
      </div>

      {/* User data */}
      {node.userData && Object.keys(node.userData).length > 0 && (
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">User Data</label>
          <div className="mt-0.5 px-2 py-1 text-[10px] bg-slate-800/50 border border-white/5 rounded text-slate-400 font-mono max-h-24 overflow-y-auto">
            {JSON.stringify(node.userData, null, 2)}
          </div>
        </div>
      )}

      {/* Visibility toggle */}
      <div>
        <button
          onClick={() => toggleNodeVisibility(node.id)}
          className={`w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
            node.visible
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
          }`}
        >
          {node.visible ? (
            <>
              <Eye size={14} /> Visible — Click to Hide
            </>
          ) : (
            <>
              <EyeOff size={14} /> Hidden — Click to Show
            </>
          )}
        </button>
      </div>

      {/* Children info */}
      {node.children && node.children.length > 0 && (
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Children</label>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
          </div>
        </div>
      )}

      {/* Deselect button */}
      <button
        onClick={() => selectNode(null)}
        className="w-full py-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
      >
        Deselect
      </button>
    </div>
  )
}

// ─── Model Properties Section ──────────────────────────────

function ModelPropertiesSection() {
  const { model, setModel } = useExperienceStore()

  if (!model) return null

  return (
    <div className="px-3 py-3 border-b border-white/5 space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Box size={11} className="text-blue-400" />
        <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Model
        </label>
      </div>
      <div>
        <label className="text-[9px] text-slate-500">Name</label>
        <input
          type="text"
          value={model.name}
          onChange={(e) => setModel({ ...model, name: e.target.value })}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[9px] text-slate-500">URL</label>
        <input
          type="text"
          value={model.url}
          onChange={(e) => setModel({ ...model, url: e.target.value })}
          className="w-full mt-0.5 px-2 py-1 text-[10px] bg-slate-800 border border-white/10 rounded text-slate-400 focus:border-emerald-500 focus:outline-none font-mono"
        />
      </div>
      <div>
        <label className="text-[9px] text-slate-500">Scale</label>
        <input
          type="number"
          step={0.1}
          min={0.01}
          value={model.scale}
          onChange={(e) => setModel({ ...model, scale: parseFloat(e.target.value) || 1 })}
          className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[9px] text-slate-500">Position</label>
        <div className="grid grid-cols-3 gap-1 mt-0.5">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <input
              key={axis}
              type="number"
              step={0.1}
              value={model.position[i]}
              onChange={(e) => {
                const newPos: [number, number, number] = [...model.position]
                newPos[i] = parseFloat(e.target.value) || 0
                setModel({ ...model, position: newPos })
              }}
              className="px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
              placeholder={axis}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-[9px] text-slate-500">Rotation (deg)</label>
        <div className="grid grid-cols-3 gap-1 mt-0.5">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <input
              key={axis}
              type="number"
              step={5}
              value={Math.round(model.rotation[i] * (180 / Math.PI))}
              onChange={(e) => {
                const newRot: [number, number, number] = [...model.rotation]
                newRot[i] = (parseFloat(e.target.value) || 0) * (Math.PI / 180)
                setModel({ ...model, rotation: newRot })
              }}
              className="px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
              placeholder={axis}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Camera Properties Section ──────────────────────────────

function CameraPropertiesSection({
  camera,
  setCamera,
}: {
  camera: { initialPosition: [number, number, number]; initialTarget: [number, number, number]; fov: number; near: number; far: number }
  setCamera: (cam: Partial<typeof camera>) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="px-3 py-3 border-b border-white/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 mb-1 w-full"
      >
        {expanded ? <ChevronDown size={10} className="text-slate-500" /> : <ChevronRight size={10} className="text-slate-500" />}
        <Aperture size={11} className="text-purple-400" />
        <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Camera
        </label>
      </button>
      {expanded && (
        <div className="space-y-2 mt-2">
          <div>
            <label className="text-[9px] text-slate-500">Position</label>
            <div className="grid grid-cols-3 gap-1 mt-0.5">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <input
                  key={axis}
                  type="number"
                  step={0.5}
                  value={camera.initialPosition[i]}
                  onChange={(e) => {
                    const newPos: [number, number, number] = [...camera.initialPosition]
                    newPos[i] = parseFloat(e.target.value) || 0
                    setCamera({ initialPosition: newPos })
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
                  placeholder={axis}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] text-slate-500">Target</label>
            <div className="grid grid-cols-3 gap-1 mt-0.5">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <input
                  key={axis}
                  type="number"
                  step={0.5}
                  value={camera.initialTarget[i]}
                  onChange={(e) => {
                    const newTarget: [number, number, number] = [...camera.initialTarget]
                    newTarget[i] = parseFloat(e.target.value) || 0
                    setCamera({ initialTarget: newTarget })
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
                  placeholder={axis}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] text-slate-500">FOV</label>
              <input
                type="number"
                step={1}
                value={camera.fov}
                onChange={(e) => setCamera({ fov: parseFloat(e.target.value) || 50 })}
                className="w-full px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500">Near</label>
              <input
                type="number"
                step={0.01}
                value={camera.near}
                onChange={(e) => setCamera({ near: parseFloat(e.target.value) || 0.1 })}
                className="w-full px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500">Far</label>
              <input
                type="number"
                step={100}
                value={camera.far}
                onChange={(e) => setCamera({ far: parseFloat(e.target.value) || 1000 })}
                className="w-full px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Scene Overview Section ──────────────────────────────

function SceneOverviewSection() {
  const { hotspots, lights, uiPanels, variables, model } = useExperienceStore()

  return (
    <div className="px-3 py-3">
      <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1 mb-2">
        <Layers size={10} className="text-slate-400" />
        Scene Summary
      </label>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><Box size={10} /> Model</span>
          <span className="text-[10px] text-slate-300">{model ? model.name : 'Demo Scene'}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><MapPin size={10} /> Hotspots</span>
          <span className="text-[10px] text-slate-300">{hotspots.length}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><Lightbulb size={10} /> Lights</span>
          <span className="text-[10px] text-slate-300">{lights.length}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><PanelTop size={10} /> UI Panels</span>
          <span className="text-[10px] text-slate-300">{uiPanels.length}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><Sparkles size={10} /> Variables</span>
          <span className="text-[10px] text-slate-300">{variables.length}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Annotation Properties Section ────────────────────────

function AnnotationPropertiesSection({ annotation }: { annotation: Annotation }) {
  const { updateAnnotation, removeAnnotation } = useExperienceStore()
  const [showColorPicker, setShowColorPicker] = useState(false)

  const updatePos = (axis: number, val: number) => {
    const newPos: [number, number, number] = [...annotation.position]
    newPos[axis] = val
    updateAnnotation(annotation.id, { position: newPos })
  }

  return (
    <div>
      {/* Title */}
      <div className="px-3 py-3 border-b border-white/5 space-y-2">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Title</label>
          <input
            type="text"
            value={annotation.title}
            onChange={(e) => updateAnnotation(annotation.id, { title: e.target.value })}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Content</label>
          <textarea
            value={annotation.content}
            onChange={(e) => updateAnnotation(annotation.id, { content: e.target.value })}
            rows={3}
            className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Color */}
      <div className="px-3 py-3 border-b border-white/5">
        <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Palette size={10} className="text-emerald-400" />
          Color
        </label>
        <div className="flex items-center gap-1.5 mt-1">
          <div
            className="w-6 h-6 rounded border border-white/20 cursor-pointer flex-shrink-0"
            style={{ backgroundColor: annotation.color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          <input
            type="text"
            value={annotation.color}
            onChange={(e) => updateAnnotation(annotation.id, { color: e.target.value })}
            className="flex-1 px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        {showColorPicker && (
          <div className="mt-2 relative">
            <HexColorPicker
              color={annotation.color}
              onChange={(color) => updateAnnotation(annotation.id, { color })}
            />
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {annotation.visible ? (
              <Eye size={12} className="text-emerald-400" />
            ) : (
              <EyeOff size={12} className="text-red-400" />
            )}
            <span className="text-[10px] text-slate-400">
              {annotation.visible ? 'Visible in scene' : 'Hidden from scene'}
            </span>
          </div>
          <button
            onClick={() => updateAnnotation(annotation.id, { visible: !annotation.visible })}
            className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
              annotation.visible
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-white/5'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
            }`}
          >
            {annotation.visible ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Position */}
      <div className="px-3 py-3 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-2">
          <Crosshair size={11} className="text-emerald-400" />
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Position</label>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis}>
              <div className={`text-[9px] mb-0.5 font-medium ${i === 0 ? 'text-red-400/60' : i === 1 ? 'text-green-400/60' : 'text-blue-400/60'}`}>{axis}</div>
              <input
                type="number"
                step={0.1}
                value={annotation.position[i]}
                onChange={(e) => updatePos(i, parseFloat(e.target.value) || 0)}
                className="w-full px-1.5 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Delete */}
      <div className="px-3 py-3">
        <button
          onClick={() => removeAnnotation(annotation.id)}
          className="w-full py-1.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 size={10} />
          Delete Annotation
        </button>
      </div>
    </div>
  )
}
