import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────

export type Vec3 = [number, number, number]

export type HotspotType = '2D' | '3D'
export type TriggerType = 'onClick' | 'onHover' | 'onProximity'

export interface ActionDef {
  id: string
  type: 'camera' | 'transform' | 'visibility' | 'variant' | 'material' | 'lighting' | 'animation' | 'ui'
  // camera
  action?: string
  target?: string
  duration?: number
  easing?: string
  offset?: Vec3
  position?: Vec3
  lookAt?: Vec3
  speed?: number
  // transform
  translate?: Vec3
  rotate?: Vec3
  scale?: Vec3
  // visibility
  visibilityAction?: 'show' | 'hide' | 'toggle'
  condition?: string
  // variant
  variantName?: string
  affects?: { materials?: string[]; meshes?: string[] }
  // material
  property?: string
  value?: string | number
  // lighting
  hdri?: string
  intensity?: number
  lightName?: string
  color?: string
  // animation
  animationName?: string
  loop?: boolean
  // ui
  panelId?: string
  content?: string
  variable?: string
}

export interface Behavior {
  id: string
  trigger: TriggerType
  actions: ActionDef[]
}

export interface Hotspot {
  id: string
  name: string
  type: HotspotType
  position: Vec3
  attachedTo?: string
  offset?: Vec3
  icon: string
  label: string
  behaviors: Behavior[]
  visible: boolean
  pulseAnimation: boolean
}

export interface UIPanel {
  id: string
  type: 'modal' | 'sidebar' | 'toast'
  title: string
  content: string
  visible: boolean
}

export type SkinPreset = 'minimal' | 'gaming' | 'corporate' | 'museum'

export interface PostProcessingConfig {
  bloom: boolean
  bloomIntensity: number
  bloomThreshold: number
  ssao: boolean
  ssaoRadius: number
  ssaoIntensity: number
  vignette: boolean
  vignetteOffset: number
  vignetteDarkness: number
  // New effects
  depthOfField: boolean
  dofFocusDistance: number
  dofFocalLength: number
  dofBokehScale: number
  chromaticAberration: boolean
  caOffset: number
  toneMapping: 'aces' | 'reinhard' | 'cineon' | 'agx' | 'linear'
  toneMappingExposure: number
  colorGrading: boolean
  cgBrightness: number
  cgContrast: number
  cgSaturation: number
  screenSpaceReflections: boolean
  ssrIntensity: number
}

export interface LightConfig {
  id: string
  name: string
  type: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere'
  color: string
  intensity: number
  position: Vec3
  target?: Vec3
  castShadow: boolean
  // Spot light
  angle?: number
  penumbra?: number
  // Hemisphere
  groundColor?: string
}

export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  hotspotStyle: SkinPreset | 'custom'
  fontFamily: string
  showOrbitControls: boolean
  showZoomButtons: boolean
  showFullscreenButton: boolean
  showARButton: boolean
  hotspotIconColor: string
  hotspotPulseAnimation: boolean
  hotspotLabelStyle: 'tooltip' | 'always' | 'hover'
  postProcessing: PostProcessingConfig
}

export interface SceneNode {
  id: string
  name: string
  type: 'mesh' | 'light' | 'camera' | 'material' | 'animation' | 'group'
  children?: SceneNode[]
  visible: boolean
  selected: boolean
  userData?: Record<string, unknown>
}

export interface ModelConfig {
  url: string
  name: string
  scale: number
  position: Vec3
  rotation: Vec3
}

export interface EnvironmentConfig {
  type: 'hdri' | 'color' | 'panorama'
  preset?: string
  color?: string
  url?: string
  intensity: number
}

export interface CameraConfig {
  initialPosition: Vec3
  initialTarget: Vec3
  fov: number
  near: number
  far: number
}

export interface Variable {
  id: string
  name: string
  value: string | number | boolean
}

export interface CameraBookmark {
  id: string
  name: string
  position: Vec3
  target: Vec3
}

// ─── Scene (Multi-Scene Tour System) ─────────────────────

export interface SceneConfig {
  id: string
  name: string
  model: ModelConfig | null
  hotspots: Hotspot[]
  environment: EnvironmentConfig
  cameraBookmarks: CameraBookmark[]
}

// ─── Measurement ─────────────────────────────────────────

export interface Measurement {
  id: string
  start: Vec3
  end: Vec3
  distance: number
}

export interface Annotation {
  id: string
  position: Vec3
  title: string
  content: string
  color: string
  visible: boolean
}

export type SidebarTab = 'scene' | 'hotspots' | 'panels' | 'variables' | 'theme' | 'export' | 'scenes'

// ─── Store State ──────────────────────────────────────────

export interface ExperienceState {
  // Project
  projectId: string
  projectName: string
  isDirty: boolean
  hasSeenWelcome: boolean
  lastSavedAt: number | null

  // Model
  model: ModelConfig | null
  sceneNodes: SceneNode[]

  // Environment
  environment: EnvironmentConfig

  // Camera
  camera: CameraConfig
  cameraBookmarks: CameraBookmark[]

  // Hotspots
  hotspots: Hotspot[]

  // UI Panels
  uiPanels: UIPanel[]

  // Variables
  variables: Variable[]

  // Theme
  theme: ThemeConfig

  // Lights
  lights: LightConfig[]

  // Preview state
  activePreviewPanel: string | null
  previewToasts: { id: string; message: string; type: 'info' | 'success' | 'warning' }[]

  // Editor state
  selectedHotspotId: string | null
  selectedNodeId: string | null
  isPreviewMode: boolean
  isAddingHotspot: boolean
  addingHotspotType: HotspotType
  showGrid: boolean
  showStats: boolean
  sidebarTab: SidebarTab
  propertiesTab: 'hotspot' | 'behaviors' | 'theme'
  showShortcutsModal: boolean

  // History (undo/redo)
  history: Record<string, unknown>[]
  historyIndex: number

  // Multi-Scene Tour
  scenes: SceneConfig[]
  activeSceneId: string

  // Measurement
  isMeasuring: boolean
  measurements: Measurement[]

  // Annotations
  annotations: Annotation[]

  // Actions
  setProjectName: (name: string) => void
  setHasSeenWelcome: (seen: boolean) => void
  setLastSavedAt: (ts: number | null) => void
  setModel: (model: ModelConfig | null) => void
  setSceneNodes: (nodes: SceneNode[]) => void
  toggleNodeVisibility: (id: string) => void
  selectNode: (id: string | null) => void
  setEnvironment: (env: Partial<EnvironmentConfig>) => void
  setCamera: (cam: Partial<CameraConfig>) => void

  addCameraBookmark: (bookmark: CameraBookmark) => void
  removeCameraBookmark: (id: string) => void

  addHotspot: (hotspot: Hotspot) => void
  updateHotspot: (id: string, updates: Partial<Hotspot>) => void
  removeHotspot: (id: string) => void
  selectHotspot: (id: string | null) => void
  setAddingHotspot: (adding: boolean, type?: HotspotType) => void

  addBehavior: (hotspotId: string, behavior: Behavior) => void
  updateBehavior: (hotspotId: string, behaviorId: string, updates: Partial<Behavior>) => void
  removeBehavior: (hotspotId: string, behaviorId: string) => void
  reorderBehaviors: (hotspotId: string, behaviorIds: string[]) => void
  addAction: (hotspotId: string, behaviorId: string, action: ActionDef) => void
  updateAction: (hotspotId: string, behaviorId: string, actionId: string, updates: Partial<ActionDef>) => void
  removeAction: (hotspotId: string, behaviorId: string, actionId: string) => void
  reorderActions: (hotspotId: string, behaviorId: string, actionIds: string[]) => void

  addUIPanel: (panel: UIPanel) => void
  updateUIPanel: (id: string, updates: Partial<UIPanel>) => void
  removeUIPanel: (id: string) => void

  addVariable: (variable: Variable) => void
  updateVariable: (id: string, updates: Partial<Variable>) => void
  removeVariable: (id: string) => void

  setTheme: (theme: Partial<ThemeConfig>) => void
  applySkinPreset: (preset: SkinPreset) => void

  setPreviewMode: (preview: boolean) => void
  setActivePreviewPanel: (panelId: string | null) => void
  addPreviewToast: (toast: { id: string; message: string; type: 'info' | 'success' | 'warning' }) => void
  removePreviewToast: (id: string) => void
  setSidebarTab: (tab: SidebarTab) => void
  setPropertiesTab: (tab: 'hotspot' | 'behaviors' | 'theme') => void
  setShowGrid: (show: boolean) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  exportProject: () => Record<string, unknown>
  importProject: (data: Record<string, unknown>) => void
  resetProject: () => void

  // Multi-Scene actions
  addScene: (scene: SceneConfig) => void
  removeScene: (id: string) => void
  switchScene: (id: string) => void
  updateScene: (id: string, updates: Partial<SceneConfig>) => void

  // Measurement actions
  setMeasuring: (v: boolean) => void
  addMeasurement: (m: Measurement) => void
  removeMeasurement: (id: string) => void
  clearMeasurements: () => void

  // Light actions
  addLight: (light: LightConfig) => void
  updateLight: (id: string, updates: Partial<LightConfig>) => void
  removeLight: (id: string) => void

  // Duplicate hotspot
  duplicateHotspot: (id: string) => void

  // Stats toggle
  setShowStats: (v: boolean) => void

  // Shortcuts modal
  setShowShortcutsModal: (v: boolean) => void

  // Annotation actions
  addAnnotation: (a: Annotation) => void
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void
  selectAnnotation: (id: string | null) => void
  selectedAnnotationId: string | null

  // Pathtracer
  pathTracerEnabled: boolean
  pathTracerSamples: number
  pathTracerMaxSamples: number
  setPathTracerEnabled: (v: boolean) => void
  setPathTracerMaxSamples: (n: number) => void
  resetPathTracerSamples: () => void
  incrementPathTracerSamples: () => void

  // Auto-save
  autoSave: () => void
}

const defaultPostProcessing: PostProcessingConfig = {
  bloom: false,
  bloomIntensity: 0.4,
  bloomThreshold: 0.6,
  ssao: false,
  ssaoRadius: 0.05,
  ssaoIntensity: 15,
  vignette: false,
  vignetteOffset: 0.1,
  vignetteDarkness: 0.8,
  // New effects
  depthOfField: false,
  dofFocusDistance: 0.01,
  dofFocalLength: 0.02,
  dofBokehScale: 2,
  chromaticAberration: false,
  caOffset: 0.002,
  toneMapping: 'aces',
  toneMappingExposure: 1.0,
  colorGrading: false,
  cgBrightness: 0,
  cgContrast: 0,
  cgSaturation: 0,
  screenSpaceReflections: false,
  ssrIntensity: 0.5,
}

const defaultLights: LightConfig[] = [
  { id: 'light_ambient', name: 'Ambient', type: 'ambient', color: '#ffffff', intensity: 0.3, position: [0, 0, 0], castShadow: false },
  { id: 'light_directional', name: 'Directional', type: 'directional', color: '#ffffff', intensity: 1.2, position: [5, 8, 5], castShadow: true },
  { id: 'light_spot', name: 'Spot', type: 'spot', color: '#ffffff', intensity: 0.5, position: [-5, 5, -5], castShadow: false, angle: 0.5, penumbra: 1 },
]

const defaultTheme: ThemeConfig = {
  primaryColor: '#10b981',
  secondaryColor: '#6b7280',
  backgroundColor: '#0f172a',
  hotspotStyle: 'minimal',
  fontFamily: 'Inter, sans-serif',
  showOrbitControls: true,
  showZoomButtons: true,
  showFullscreenButton: true,
  showARButton: false,
  hotspotIconColor: '#10b981',
  hotspotPulseAnimation: true,
  hotspotLabelStyle: 'hover',
  postProcessing: defaultPostProcessing,
}

const defaultEnvironment: EnvironmentConfig = {
  type: 'hdri',
  preset: 'studio',
  intensity: 1.0,
}

const defaultCamera: CameraConfig = {
  initialPosition: [5, 3, 5],
  initialTarget: [0, 0, 0],
  fov: 50,
  near: 0.1,
  far: 1000,
}

const skinPresets: Record<SkinPreset, Partial<ThemeConfig>> = {
  minimal: {
    primaryColor: '#10b981',
    secondaryColor: '#6b7280',
    backgroundColor: '#0f172a',
    hotspotStyle: 'minimal',
    hotspotIconColor: '#10b981',
    hotspotPulseAnimation: true,
    hotspotLabelStyle: 'hover',
  },
  gaming: {
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    backgroundColor: '#1a1a2e',
    hotspotStyle: 'gaming',
    hotspotIconColor: '#f59e0b',
    hotspotPulseAnimation: true,
    hotspotLabelStyle: 'always',
  },
  corporate: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    backgroundColor: '#f8fafc',
    hotspotStyle: 'corporate',
    hotspotIconColor: '#3b82f6',
    hotspotPulseAnimation: false,
    hotspotLabelStyle: 'tooltip',
  },
  museum: {
    primaryColor: '#a855f7',
    secondaryColor: '#78716c',
    backgroundColor: '#1c1917',
    hotspotStyle: 'museum',
    hotspotIconColor: '#a855f7',
    hotspotPulseAnimation: true,
    hotspotLabelStyle: 'hover',
  },
}

let counter = 0
const uid = () => `id_${Date.now()}_${++counter}`

const defaultSceneId = uid()

export const useExperienceStore = create<ExperienceState>()(
  persist(
    (set, get) => ({
      // ── Initial state ─────────────────────────────
      projectId: uid(),
      projectName: 'Untitled Experience',
      isDirty: false,
      hasSeenWelcome: false,
      lastSavedAt: null,

      model: null,
      sceneNodes: [],

      environment: defaultEnvironment,
      camera: defaultCamera,
      cameraBookmarks: [],

      hotspots: [],
      uiPanels: [],
      variables: [],

      theme: defaultTheme,
      lights: defaultLights,

      activePreviewPanel: null,
      previewToasts: [],

      selectedHotspotId: null,
      selectedNodeId: null,
      isPreviewMode: false,
      isAddingHotspot: false,
      addingHotspotType: '3D',
      showGrid: true,
      showStats: false,
      sidebarTab: 'scene',
      propertiesTab: 'hotspot',
      showShortcutsModal: false,

      history: [],
      historyIndex: -1,

      // Multi-Scene
      scenes: [{ id: defaultSceneId, name: 'Scene 1', model: null, hotspots: [], environment: defaultEnvironment, cameraBookmarks: [] }],
      activeSceneId: defaultSceneId,

      // Measurement
      isMeasuring: false,
      measurements: [],

      // Annotations
      annotations: [],
      selectedAnnotationId: null,

      // Pathtracer
      pathTracerEnabled: false,
      pathTracerSamples: 0,
      pathTracerMaxSamples: 512,

      // ── Project ───────────────────────────────────
      setProjectName: (name) => set({ projectName: name, isDirty: true }),

      setHasSeenWelcome: (seen) => set({ hasSeenWelcome: seen }),

      setLastSavedAt: (ts) => set({ lastSavedAt: ts }),

      // ── Model ─────────────────────────────────────
      setModel: (model) => set({ model, isDirty: true }),

      setSceneNodes: (nodes) => set({ sceneNodes: nodes, isDirty: true }),

      toggleNodeVisibility: (id) =>
        set((s) => ({
          sceneNodes: toggleVis(s.sceneNodes, id),
          isDirty: true,
        })),

      selectNode: (id) => set({ selectedNodeId: id }),

      // ── Environment ───────────────────────────────
      setEnvironment: (env) =>
        set((s) => ({
          environment: { ...s.environment, ...env },
          isDirty: true,
        })),

      // ── Camera ────────────────────────────────────
      setCamera: (cam) =>
        set((s) => ({ camera: { ...s.camera, ...cam }, isDirty: true })),

      // ── Hotspots ──────────────────────────────────
      addHotspot: (hotspot) =>
        set((s) => ({
          hotspots: [...s.hotspots, hotspot],
          isDirty: true,
        })),

      updateHotspot: (id, updates) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
          isDirty: true,
        })),

      removeHotspot: (id) =>
        set((s) => ({
          hotspots: s.hotspots.filter((h) => h.id !== id),
          selectedHotspotId: s.selectedHotspotId === id ? null : s.selectedHotspotId,
          isDirty: true,
        })),

      selectHotspot: (id) => set({ selectedHotspotId: id }),

      setAddingHotspot: (adding, type = '3D') =>
        set({ isAddingHotspot: adding, addingHotspotType: type }),

      // ── Behaviors ─────────────────────────────────
      addBehavior: (hotspotId, behavior) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) =>
            h.id === hotspotId
              ? { ...h, behaviors: [...h.behaviors, behavior] }
              : h
          ),
          isDirty: true,
        })),

      updateBehavior: (hotspotId, behaviorId, updates) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) =>
            h.id === hotspotId
              ? {
                  ...h,
                  behaviors: h.behaviors.map((b) =>
                    b.id === behaviorId ? { ...b, ...updates } : b
                  ),
                }
              : h
          ),
          isDirty: true,
        })),

      removeBehavior: (hotspotId, behaviorId) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) =>
            h.id === hotspotId
              ? { ...h, behaviors: h.behaviors.filter((b) => b.id !== behaviorId) }
              : h
          ),
          isDirty: true,
        })),

      reorderBehaviors: (hotspotId, behaviorIds) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) => {
            if (h.id !== hotspotId) return h
            const reordered = behaviorIds
              .map((id) => h.behaviors.find((b) => b.id === id))
              .filter(Boolean) as Behavior[]
            return { ...h, behaviors: reordered }
          }),
          isDirty: true,
        })),

      addAction: (hotspotId, behaviorId, action) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) =>
            h.id === hotspotId
              ? {
                  ...h,
                  behaviors: h.behaviors.map((b) =>
                    b.id === behaviorId
                      ? { ...b, actions: [...b.actions, action] }
                      : b
                  ),
                }
              : h
          ),
          isDirty: true,
        })),

      updateAction: (hotspotId, behaviorId, actionId, updates) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) =>
            h.id === hotspotId
              ? {
                  ...h,
                  behaviors: h.behaviors.map((b) =>
                    b.id === behaviorId
                      ? {
                          ...b,
                          actions: b.actions.map((a) =>
                            a.id === actionId ? { ...a, ...updates } : a
                          ),
                        }
                      : b
                  ),
                }
              : h
          ),
          isDirty: true,
        })),

      removeAction: (hotspotId, behaviorId, actionId) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) =>
            h.id === hotspotId
              ? {
                  ...h,
                  behaviors: h.behaviors.map((b) =>
                    b.id === behaviorId
                      ? {
                          ...b,
                          actions: b.actions.filter((a) => a.id !== actionId),
                        }
                      : b
                  ),
                }
              : h
          ),
          isDirty: true,
        })),

      reorderActions: (hotspotId, behaviorId, actionIds) =>
        set((s) => ({
          hotspots: s.hotspots.map((h) => {
            if (h.id !== hotspotId) return h
            return {
              ...h,
              behaviors: h.behaviors.map((b) => {
                if (b.id !== behaviorId) return b
                const reordered = actionIds
                  .map((id) => b.actions.find((a) => a.id === id))
                  .filter(Boolean) as ActionDef[]
                return { ...b, actions: reordered }
              }),
            }
          }),
          isDirty: true,
        })),

      // ── UI Panels ─────────────────────────────────
      addUIPanel: (panel) =>
        set((s) => ({ uiPanels: [...s.uiPanels, panel], isDirty: true })),

      updateUIPanel: (id, updates) =>
        set((s) => ({
          uiPanels: s.uiPanels.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          isDirty: true,
        })),

      removeUIPanel: (id) =>
        set((s) => ({
          uiPanels: s.uiPanels.filter((p) => p.id !== id),
          isDirty: true,
        })),

      // ── Variables ─────────────────────────────────
      addVariable: (variable) =>
        set((s) => ({ variables: [...s.variables, variable], isDirty: true })),

      updateVariable: (id, updates) =>
        set((s) => ({
          variables: s.variables.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
          isDirty: true,
        })),

      removeVariable: (id) =>
        set((s) => ({
          variables: s.variables.filter((v) => v.id !== id),
          isDirty: true,
        })),

      // ── Theme ─────────────────────────────────────
      setTheme: (theme) =>
        set((s) => ({
          theme: {
            ...s.theme,
            ...theme,
            postProcessing: {
              ...(s.theme.postProcessing || defaultPostProcessing),
              ...(theme.postProcessing || {}),
            },
          },
          isDirty: true,
        })),

      applySkinPreset: (preset) =>
        set((s) => ({
          theme: {
            ...s.theme,
            ...skinPresets[preset],
            hotspotStyle: preset,
            postProcessing: s.theme.postProcessing || defaultPostProcessing,
          },
          isDirty: true,
        })),

      // ── Editor ────────────────────────────────────
      setPreviewMode: (preview) => set({ isPreviewMode: preview, activePreviewPanel: null, previewToasts: [] }),

      setActivePreviewPanel: (panelId) => set({ activePreviewPanel: panelId }),

      addPreviewToast: (toast) =>
        set((s) => ({ previewToasts: [...s.previewToasts, toast] })),

      removePreviewToast: (id) =>
        set((s) => ({ previewToasts: s.previewToasts.filter((t) => t.id !== id) })),

      setSidebarTab: (tab) => set({ sidebarTab: tab }),

      setPropertiesTab: (tab) => set({ propertiesTab: tab }),

      setShowGrid: (show) => set({ showGrid: show }),

      // ── Camera Bookmarks ─────────────────────────
      addCameraBookmark: (bookmark) =>
        set((s) => ({ cameraBookmarks: [...s.cameraBookmarks, bookmark], isDirty: true })),

      removeCameraBookmark: (id) =>
        set((s) => ({ cameraBookmarks: s.cameraBookmarks.filter((b) => b.id !== id), isDirty: true })),

      // ── History (Undo/Redo) ──────────────────────
      pushHistory: () => {
        const s = get()
        const snapshot = {
          hotspots: JSON.parse(JSON.stringify(s.hotspots)),
          uiPanels: JSON.parse(JSON.stringify(s.uiPanels)),
          variables: JSON.parse(JSON.stringify(s.variables)),
          theme: JSON.parse(JSON.stringify(s.theme)),
          environment: JSON.parse(JSON.stringify(s.environment)),
          camera: JSON.parse(JSON.stringify(s.camera)),
          model: s.model ? JSON.parse(JSON.stringify(s.model)) : null,
        }
        const newHistory = s.history.slice(0, s.historyIndex + 1)
        newHistory.push(snapshot)
        if (newHistory.length > 50) newHistory.shift()
        set({ history: newHistory, historyIndex: newHistory.length - 1 })
      },

      undo: () => {
        const s = get()
        if (s.historyIndex <= 0) return
        const newIndex = s.historyIndex - 1
        const snapshot = s.history[newIndex]
        if (snapshot) {
          set({
            ...snapshot,
            historyIndex: newIndex,
            isDirty: true,
          })
        }
      },

      redo: () => {
        const s = get()
        if (s.historyIndex >= s.history.length - 1) return
        const newIndex = s.historyIndex + 1
        const snapshot = s.history[newIndex]
        if (snapshot) {
          set({
            ...snapshot,
            historyIndex: newIndex,
            isDirty: true,
          })
        }
      },

      // ── Export / Import ───────────────────────────
      exportProject: () => {
        const s = get()
        return {
          projectId: s.projectId,
          name: s.projectName,
          model: s.model,
          environment: s.environment,
          camera: s.camera,
          cameraBookmarks: s.cameraBookmarks,
          hotspots: s.hotspots,
          uiPanels: s.uiPanels,
          variables: s.variables,
          theme: s.theme,
          scenes: s.scenes,
          activeSceneId: s.activeSceneId,
          measurements: s.measurements,
        }
      },

      importProject: (data) => {
        const importedTheme = data.theme as Partial<ThemeConfig> | undefined
        const mergedTheme: ThemeConfig = {
          ...defaultTheme,
          ...(importedTheme || {}),
          postProcessing: {
            ...defaultPostProcessing,
            ...(importedTheme?.postProcessing || {}),
          },
        }
        return set({
          projectId: (data.projectId as string) || uid(),
          projectName: (data.name as string) || 'Imported Experience',
          model: (data.model as ModelConfig | null) || null,
          environment: (data.environment as EnvironmentConfig) || defaultEnvironment,
          camera: (data.camera as CameraConfig) || defaultCamera,
          cameraBookmarks: (data.cameraBookmarks as CameraBookmark[]) || [],
          hotspots: (data.hotspots as Hotspot[]) || [],
          uiPanels: (data.uiPanels as UIPanel[]) || [],
          variables: (data.variables as Variable[]) || [],
          theme: mergedTheme,
          scenes: (data.scenes as SceneConfig[]) || [{ id: uid(), name: 'Scene 1', model: null, hotspots: [], environment: defaultEnvironment, cameraBookmarks: [] }],
          activeSceneId: (data.activeSceneId as string) || '',
          measurements: (data.measurements as Measurement[]) || [],
          isDirty: false,
          selectedHotspotId: null,
          selectedNodeId: null,
          isPreviewMode: false,
          isAddingHotspot: false,
        })
      },

      resetProject: () => {
        const newSceneId = uid()
        return set({
          projectId: uid(),
          projectName: 'Untitled Experience',
          isDirty: false,
          model: null,
          sceneNodes: [],
          environment: defaultEnvironment,
          camera: defaultCamera,
          cameraBookmarks: [],
          hotspots: [],
          uiPanels: [],
          variables: [],
          theme: defaultTheme,
          selectedHotspotId: null,
          selectedNodeId: null,
          isPreviewMode: false,
          isAddingHotspot: false,
          activePreviewPanel: null,
          previewToasts: [],
          history: [],
          historyIndex: -1,
          scenes: [{ id: newSceneId, name: 'Scene 1', model: null, hotspots: [], environment: defaultEnvironment, cameraBookmarks: [] }],
          activeSceneId: newSceneId,
          isMeasuring: false,
          measurements: [],
          lights: defaultLights,
          annotations: [],
          lastSavedAt: null,
          showStats: false,
          showShortcutsModal: false,
        })
      },

      // ── Multi-Scene ───────────────────────────────
      addScene: (scene) =>
        set((s) => ({ scenes: [...s.scenes, scene], isDirty: true })),

      removeScene: (id) =>
        set((s) => {
          if (s.scenes.length <= 1) return s // Don't remove last scene
          const newScenes = s.scenes.filter((sc) => sc.id !== id)
          const newActiveId = s.activeSceneId === id ? newScenes[0]?.id || '' : s.activeSceneId
          return { scenes: newScenes, activeSceneId: newActiveId, isDirty: true }
        }),

      switchScene: (id) =>
        set((s) => {
          const scene = s.scenes.find((sc) => sc.id === id)
          if (!scene) return s
          // Save current scene state first
          const updatedScenes = s.scenes.map((sc) =>
            sc.id === s.activeSceneId
              ? { ...sc, model: s.model, hotspots: s.hotspots, environment: s.environment, cameraBookmarks: s.cameraBookmarks }
              : sc
          )
          // Load the target scene
          const targetScene = updatedScenes.find((sc) => sc.id === id)
          return {
            scenes: updatedScenes,
            activeSceneId: id,
            model: targetScene?.model || null,
            hotspots: targetScene?.hotspots || [],
            environment: targetScene?.environment || defaultEnvironment,
            cameraBookmarks: targetScene?.cameraBookmarks || [],
            selectedHotspotId: null,
            isDirty: true,
          }
        }),

      updateScene: (id, updates) =>
        set((s) => ({
          scenes: s.scenes.map((sc) =>
            sc.id === id ? { ...sc, ...updates } : sc
          ),
          isDirty: true,
        })),

      // ── Measurement ───────────────────────────────
      setMeasuring: (v) => set({ isMeasuring: v }),

      addMeasurement: (m) =>
        set((s) => ({ measurements: [...s.measurements, m], isDirty: true })),

      removeMeasurement: (id) =>
        set((s) => ({
          measurements: s.measurements.filter((m) => m.id !== id),
          isDirty: true,
        })),

      clearMeasurements: () =>
        set({ measurements: [], isDirty: true }),

      // ── Lights ─────────────────────────────────────
      addLight: (light) =>
        set((s) => ({ lights: [...s.lights, light], isDirty: true })),

      updateLight: (id, updates) =>
        set((s) => ({
          lights: s.lights.map((l) => l.id === id ? { ...l, ...updates } : l),
          isDirty: true,
        })),

      removeLight: (id) =>
        set((s) => ({ lights: s.lights.filter((l) => l.id !== id), isDirty: true })),

      // ── Duplicate Hotspot ─────────────────────────
      duplicateHotspot: (id) =>
        set((s) => {
          const h = s.hotspots.find((hs) => hs.id === id)
          if (!h) return s
          const newId = `hs_${Date.now()}`
          return {
            hotspots: [...s.hotspots, {
              ...JSON.parse(JSON.stringify(h)),
              id: newId,
              name: `${h.name} (copy)`,
              position: [h.position[0] + 0.3, h.position[1], h.position[2] + 0.3] as Vec3,
            }],
            selectedHotspotId: newId,
            isDirty: true,
          }
        }),

      // ── Stats & Shortcuts ─────────────────────────
      setShowStats: (v) => set({ showStats: v }),
      setShowShortcutsModal: (v) => set({ showShortcutsModal: v }),

      // ── Annotations ───────────────────────────────
      addAnnotation: (a) =>
        set((s) => ({ annotations: [...s.annotations, a], isDirty: true })),

      updateAnnotation: (id, updates) =>
        set((s) => ({
          annotations: s.annotations.map((a) => a.id === id ? { ...a, ...updates } : a),
          isDirty: true,
        })),

      removeAnnotation: (id) =>
        set((s) => ({
          annotations: s.annotations.filter((a) => a.id !== id),
          selectedAnnotationId: s.selectedAnnotationId === id ? null : s.selectedAnnotationId,
          isDirty: true,
        })),

      selectAnnotation: (id) => set({ selectedAnnotationId: id }),

      // ── Pathtracer ────────────────────────────────
      setPathTracerEnabled: (v) => set({ pathTracerEnabled: v, pathTracerSamples: 0, isDirty: true }),
      setPathTracerMaxSamples: (n) => set({ pathTracerMaxSamples: n, pathTracerSamples: 0, isDirty: true }),
      resetPathTracerSamples: () => set({ pathTracerSamples: 0 }),
      incrementPathTracerSamples: () =>
        set((s) => ({ pathTracerSamples: s.pathTracerSamples + 1 })),

      // ── Auto-Save ─────────────────────────────────
      autoSave: () => {
        const s = get()
        if (!s.isDirty) return
        // The persist middleware already saves to localStorage,
        // so we just mark the timestamp and clean the dirty flag
        set({ lastSavedAt: Date.now(), isDirty: false })
        // Also persist to server via API
        try {
          const projectData = {
            name: s.projectName,
            data: {
              projectId: s.projectId,
              name: s.projectName,
              model: s.model,
              environment: s.environment,
              camera: s.camera,
              cameraBookmarks: s.cameraBookmarks,
              hotspots: s.hotspots,
              uiPanels: s.uiPanels,
              variables: s.variables,
              theme: s.theme,
              scenes: s.scenes,
              activeSceneId: s.activeSceneId,
              measurements: s.measurements,
              annotations: s.annotations,
              lights: s.lights,
            },
          }
          // Check if we have a saved server project ID
          const serverId = (globalThis as Record<string, unknown>).__serverProjectId as string | undefined
          if (serverId) {
            fetch(`/api/projects/${serverId}?XTransformPort=3000`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(projectData),
            }).catch(() => {
              // Silently fail — localStorage is the primary persistence
            })
          } else {
            fetch('/api/projects?XTransformPort=3000', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(projectData),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.id) {
                  ;(globalThis as Record<string, unknown>).__serverProjectId = data.id
                }
              })
              .catch(() => {
                // Silently fail — localStorage is the primary persistence
              })
          }
        } catch {
          // Silently fail — localStorage is the primary persistence
        }
      },
    }),
    {
      name: '3d-experience-builder',
      partialize: (state) => ({
        projectId: state.projectId,
        projectName: state.projectName,
        hasSeenWelcome: state.hasSeenWelcome,
        lastSavedAt: state.lastSavedAt,
        model: state.model,
        sceneNodes: state.sceneNodes,
        environment: state.environment,
        camera: state.camera,
        cameraBookmarks: state.cameraBookmarks,
        hotspots: state.hotspots,
        uiPanels: state.uiPanels,
        variables: state.variables,
        theme: state.theme,
        lights: state.lights,
        scenes: state.scenes,
        activeSceneId: state.activeSceneId,
        measurements: state.measurements,
        annotations: state.annotations,
        pathTracerEnabled: state.pathTracerEnabled,
        pathTracerMaxSamples: state.pathTracerMaxSamples,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ExperienceState>
        // Deep-merge theme to ensure new fields like postProcessing exist
        const persistedPP = (p.theme as Partial<ThemeConfig> | undefined)?.postProcessing as Partial<PostProcessingConfig> | undefined
        const mergedTheme: ThemeConfig = {
          ...defaultTheme,
          ...(p.theme as Partial<ThemeConfig> | undefined),
          postProcessing: {
            ...defaultPostProcessing,
            ...(persistedPP || {}),
          },
        }
        return {
          ...current,
          ...(p as Record<string, unknown>),
          theme: mergedTheme,
          lights: (p.lights as LightConfig[] | undefined) || current.lights || defaultLights,
          scenes: p.scenes || current.scenes,
          measurements: p.measurements || current.measurements,
          annotations: (p.annotations as Annotation[] | undefined) || current.annotations || [],
          activeSceneId: p.activeSceneId || current.activeSceneId,
          lastSavedAt: (p.lastSavedAt as number | null) || null,
          showStats: (p.showStats as boolean) || false,
          pathTracerEnabled: (p.pathTracerEnabled as boolean) ?? false,
          pathTracerMaxSamples: (p.pathTracerMaxSamples as number) ?? 512,
          pathTracerSamples: 0,
          selectedAnnotationId: null,
        }
      },
    }
  )
)

// Helper: recursively toggle visibility in scene tree
function toggleVis(nodes: SceneNode[], id: string): SceneNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, visible: !n.visible }
    if (n.children) return { ...n, children: toggleVis(n.children, id) }
    return n
  })
}
