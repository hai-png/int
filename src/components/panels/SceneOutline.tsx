'use client'

import React, { useCallback, useEffect } from 'react'
import { useExperienceStore, type SceneNode } from '@/store/experience-store'
import * as THREE from 'three'
import {
  Box,
  Lightbulb,
  Camera,
  Palette,
  Film,
  FolderOpen,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Cuboid,
} from 'lucide-react'

// ─── Icons per type ───────────────────────────────────────

const nodeIcons: Record<string, React.ReactNode> = {
  mesh: <Box size={14} />,
  light: <Lightbulb size={14} />,
  camera: <Camera size={14} />,
  material: <Palette size={14} />,
  animation: <Film size={14} />,
  group: <FolderOpen size={14} />,
}

const nodeColors: Record<string, string> = {
  mesh: 'text-blue-400',
  light: 'text-yellow-400',
  camera: 'text-purple-400',
  material: 'text-pink-400',
  animation: 'text-orange-400',
  group: 'text-slate-400',
}

// ─── Tree Node ────────────────────────────────────────────

function TreeNode({
  node,
  depth = 0,
}: {
  node: SceneNode
  depth?: number
}) {
  const { toggleNodeVisibility, selectNode, selectedNodeId } = useExperienceStore()
  const [expanded, setExpanded] = React.useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedNodeId === node.id

  return (
    <div>
      <div
        className={`
          flex items-center gap-1 py-1 px-2 rounded cursor-pointer group transition-colors
          ${isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-white/5 text-slate-300'}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => selectNode(node.id)}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-0.5 hover:bg-white/10 rounded"
          >
            {expanded ? (
              <ChevronDown size={12} className="text-slate-500" />
            ) : (
              <ChevronRight size={12} className="text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        <span className={nodeColors[node.type] || 'text-slate-400'}>
          {nodeIcons[node.type] || <Cuboid size={14} />}
        </span>

        {/* Name */}
        <span className={`flex-1 text-xs truncate ${!node.visible ? 'text-slate-600 line-through' : ''}`}>{node.name}</span>

        {/* Visibility toggle - always visible for easier access */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleNodeVisibility(node.id)
          }}
          className="p-0.5 hover:bg-white/10 rounded transition-colors"
          title={node.visible ? 'Hide' : 'Show'}
        >
          {node.visible ? (
            <Eye size={12} className="text-slate-400" />
          ) : (
            <EyeOff size={12} className="text-red-400" />
          )}
        </button>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helper: build SceneNode[] from Three.js scene ──────

function buildSceneNodesFromThreeScene(scene: THREE.Scene): SceneNode[] {
  function processObject(obj: THREE.Object3D): SceneNode | null {
    // Skip cameras, lights (handled separately), and the root scene
    if (obj.type === 'Scene' || obj.type === 'Camera' || (obj as any).isLight) return null
    // Skip unnamed plain Object3D groups that have no children
    if (!obj.name && obj.type === 'Object3D' && obj.children.length === 0) return null

    const nodeType = obj.type === 'Mesh' || obj.type === 'SkinnedMesh' ? 'mesh' :
                     obj.type === 'Group' || obj.type === 'Object3D' ? 'group' : 'mesh'

    // Recursively process children to preserve parent-child relationships
    const children: SceneNode[] = []
    for (const child of obj.children) {
      const childNode = processObject(child)
      if (childNode) children.push(childNode)
    }

    return {
      id: `node_${obj.name || obj.uuid.slice(0, 8)}`,
      name: obj.name || obj.type,
      type: nodeType,
      visible: obj.visible,
      selected: false,
      children: children.length > 0 ? children : undefined,
      userData: { uuid: obj.uuid, meshName: obj.name },
    }

    // Write ID to userData for visibility sync
    obj.userData.sceneNodeId = `node_${obj.name || obj.uuid.slice(0, 8)}`
  }

  const nodes: SceneNode[] = []
  for (const child of scene.children) {
    const node = processObject(child)
    if (!node) continue
    // Flatten unnamed container groups — their children bubble up to the top level
    if (!child.name && child.type !== 'Mesh' && node.children) {
      nodes.push(...node.children)
    } else {
      nodes.push(node)
    }
  }
  return nodes
}

// ─── Scene Outline Panel ──────────────────────────────────

export function SceneOutline() {
  const { sceneNodes, model, setSceneNodes } = useExperienceStore()

  // Introspect the Three.js scene when a model is loaded
  useEffect(() => {
    if (!model) return
    // Small delay to allow R3F to render the model into the scene
    const timer = setTimeout(() => {
      const r3fScene = (globalThis as Record<string, unknown>).__r3fScene as THREE.Scene | undefined
      if (!r3fScene) return

      const modelNodes = buildSceneNodesFromThreeScene(r3fScene)
      if (modelNodes.length === 0) return

      // Build the full scene tree with model nodes under the model group
      const nodes: SceneNode[] = [
        {
          id: 'scene_root',
          name: 'Scene',
          type: 'group',
          visible: true,
          selected: false,
          children: [
            {
              id: 'model_group',
              name: model.name || 'Model',
              type: 'group',
              visible: true,
              selected: false,
              children: modelNodes,
            },
            {
              id: 'light_ambient',
              name: 'Ambient Light',
              type: 'light',
              visible: true,
              selected: false,
            },
            {
              id: 'light_directional',
              name: 'Directional Light',
              type: 'light',
              visible: true,
              selected: false,
            },
            {
              id: 'light_spot',
              name: 'Spot Light',
              type: 'light',
              visible: true,
              selected: false,
            },
            {
              id: 'light_point_emerald',
              name: 'Point Light (Emerald)',
              type: 'light',
              visible: true,
              selected: false,
            },
            {
              id: 'light_point_gold',
              name: 'Point Light (Gold)',
              type: 'light',
              visible: true,
              selected: false,
            },
            {
              id: 'cam_perspective',
              name: 'Perspective Camera',
              type: 'camera',
              visible: true,
              selected: false,
            },
          ],
        },
      ]

      setSceneNodes(nodes)
    }, 500) // Wait for model to be rendered in the scene

    return () => clearTimeout(timer)
  }, [model, setSceneNodes])

  // Build default scene nodes if none exist, then persist them
  const displayNodes = React.useMemo(() => {
    if (sceneNodes.length > 0) return sceneNodes

    // Default scene structure
    const nodes: SceneNode[] = [
      {
        id: 'scene_root',
        name: 'Scene',
        type: 'group',
        visible: true,
        selected: false,
        children: [],
      },
    ]

    if (model) {
      // When model is set but scene hasn't been introspected yet,
      // show a placeholder that will be replaced by the useEffect above
      nodes[0].children!.push({
        id: 'model_group',
        name: model.name || 'Model',
        type: 'group',
        visible: true,
        selected: false,
        children: [],
      })
    } else {
      nodes[0].children!.push(
        {
          id: 'demo_platform',
          name: 'Platform',
          type: 'mesh',
          visible: true,
          selected: false,
        },
        {
          id: 'demo_pedestal',
          name: 'Pedestal',
          type: 'mesh',
          visible: true,
          selected: false,
        },
        {
          id: 'demo_torusknot',
          name: 'Torus Knot (Emerald)',
          type: 'mesh',
          visible: true,
          selected: false,
        },
        {
          id: 'demo_sphere_gold',
          name: 'Gold Sphere',
          type: 'mesh',
          visible: true,
          selected: false,
        },
        {
          id: 'demo_octahedron_red',
          name: 'Red Octahedron',
          type: 'mesh',
          visible: true,
          selected: false,
        },
        {
          id: 'demo_torus_purple',
          name: 'Purple Torus',
          type: 'mesh',
          visible: true,
          selected: false,
        },
        {
          id: 'demo_cubes',
          name: 'Floating Cubes',
          type: 'group',
          visible: true,
          selected: false,
          children: [
            { id: 'demo_cube_cyan', name: 'Cyan Cube', type: 'mesh', visible: true, selected: false },
            { id: 'demo_cube_pink', name: 'Pink Cube', type: 'mesh', visible: true, selected: false },
            { id: 'demo_cube_lime', name: 'Lime Cube', type: 'mesh', visible: true, selected: false },
          ],
        },
        {
          id: 'demo_stairs',
          name: 'Staircase',
          type: 'group',
          visible: true,
          selected: false,
          children: Array.from({ length: 5 }, (_, i) => ({
            id: `demo_step_${i}`,
            name: `Step ${i + 1}`,
            type: 'mesh' as const,
            visible: true,
            selected: false,
          })),
        },
      )
    }

    nodes[0].children!.push(
      {
        id: 'light_ambient',
        name: 'Ambient Light',
        type: 'light',
        visible: true,
        selected: false,
      },
      {
        id: 'light_directional',
        name: 'Directional Light',
        type: 'light',
        visible: true,
        selected: false,
      },
      {
        id: 'light_spot',
        name: 'Spot Light',
        type: 'light',
        visible: true,
        selected: false,
      },
      {
        id: 'light_point_emerald',
        name: 'Point Light (Emerald)',
        type: 'light',
        visible: true,
        selected: false,
      },
      {
        id: 'light_point_gold',
        name: 'Point Light (Gold)',
        type: 'light',
        visible: true,
        selected: false,
      },
      {
        id: 'cam_perspective',
        name: 'Perspective Camera',
        type: 'camera',
        visible: true,
        selected: false,
      }
    )

    return nodes
  }, [sceneNodes, model])

  // Persist default scene nodes to store when generated for the first time
  React.useEffect(() => {
    if (sceneNodes.length === 0 && displayNodes.length > 0) {
      setSceneNodes(displayNodes)
    }
  }, [sceneNodes.length, displayNodes, setSceneNodes])

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Scene Outline
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {displayNodes.map((node) => (
          <TreeNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  )
}
