'use client'

import React, { useRef, useCallback, useMemo, Suspense, useState, useEffect } from 'react'
import { Canvas, useThree, useFrame, type ThreeEvent } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Html,
  useGLTF,
  Center,
  Loader,
  ContactShadows,
  SpotLight,
  useTexture,
  TransformControls,
} from '@react-three/drei'
import {
  useExperienceStore,
  type Vec3,
  type ActionDef,
  type Hotspot,
  type Measurement,
  type Annotation,
  type LightConfig,
  type SceneNode,
} from '@/store/experience-store'
import { EffectComposer, Bloom, Vignette, DepthOfField, ChromaticAberration, N8AO } from '@react-three/postprocessing'
import * as THREE from 'three'

// ─── Hotspot 3D Marker ────────────────────────────────────

function HotspotMarker({
  hotspot,
  iconColor,
  labelStyle,
  isSelected,
  isPreview,
  onClick,
}: {
  hotspot: Hotspot
  iconColor: string
  labelStyle: string
  isSelected: boolean
  isPreview: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const hoverExecutedRef = useRef(false)
  const { pulseAnimation, icon, label, position, type, offset } = hotspot

  useFrame(() => {
    if (ringRef.current && pulseAnimation) {
      ringRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.2)
    }
  })

  const showLabel =
    labelStyle === 'always' || (labelStyle === 'hover' && hovered) || isSelected

  // Handle hover behaviors in preview mode
  useEffect(() => {
    if (isPreview && hovered && !hoverExecutedRef.current) {
      hoverExecutedRef.current = true
      const state = useExperienceStore.getState()
      const h = state.hotspots.find((hs) => hs.id === hotspot.id)
      if (h) {
        for (const behavior of h.behaviors) {
          if (behavior.trigger === 'onHover') {
            for (const action of behavior.actions) {
              executeAction(action)
            }
          }
        }
      }
    }
    if (!hovered) {
      hoverExecutedRef.current = false
    }
  }, [isPreview, hovered, hotspot.id])

  // 2D hotspots render as screen-space overlay elements
  if (type === '2D') {
    const offsetX = offset?.[0] ?? 50
    const offsetY = offset?.[1] ?? 50
    return (
      <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
        <div
          style={{
            position: 'absolute',
            left: `${offsetX}%`,
            top: `${offsetY}%`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'auto',
            cursor: isPreview ? 'pointer' : 'default',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
            if (isPreview) {
              executeBehaviors(hotspot.id, 'onClick')
            }
          }}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            {/* Flat pin icon style for 2D */}
            <div style={{
              width: hovered || isSelected ? 28 : 24,
              height: hovered || isSelected ? 28 : 24,
              borderRadius: '50% 50% 50% 0',
              background: iconColor,
              transform: 'rotate(-45deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${iconColor}66`,
              transition: 'all 0.15s ease',
            }}>
              <span style={{
                transform: 'rotate(45deg)',
                fontSize: 10,
                lineHeight: 1,
              }}>
                {icon || '📌'}
              </span>
            </div>
            {/* Small triangle pointing down */}
            <div style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `6px solid ${iconColor}`,
              marginTop: -4,
            }} />
            {/* Label */}
            {showLabel && (
              <div style={{
                background: 'rgba(0,0,0,0.85)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif',
                border: `1px solid ${iconColor}`,
                marginTop: 2,
              }}>
                {label}
              </div>
            )}
          </div>
        </div>
      </Html>
    )
  }

  // 3D hotspots - original sphere + ring marker

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
          if (isPreview) {
            executeBehaviors(hotspot.id, 'onClick')
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        scale={hovered || isSelected ? 1.3 : 1}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={iconColor}
          emissive={iconColor}
          emissiveIntensity={hovered || isSelected ? 0.8 : 0.3}
        />
      </mesh>

      {pulseAnimation && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.2, 32]} />
          <meshBasicMaterial color={iconColor} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.26, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {showLabel && (
        <Html position={[0, 0.3, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
          <div
            style={{
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, sans-serif',
              border: `1px solid ${iconColor}`,
            }}
          >
            {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── Demo Scene (fallback when no model) ──────────────────

function DemoScene() {
  const groupRef = useRef<THREE.Group>(null)
  const knotRef = useRef<THREE.Mesh>(null)
  const cube1Ref = useRef<THREE.Mesh>(null)
  const cube2Ref = useRef<THREE.Mesh>(null)
  const cube3Ref = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05
    if (knotRef.current) {
      knotRef.current.rotation.x += delta * 0.3
      knotRef.current.rotation.z += delta * 0.2
    }
    const t = state.clock.elapsedTime
    if (cube1Ref.current) {
      cube1Ref.current.position.y = 2.2 + Math.sin(t * 1.5) * 0.3
      cube1Ref.current.rotation.x = t * 0.5
      cube1Ref.current.rotation.y = t * 0.3
    }
    if (cube2Ref.current) {
      cube2Ref.current.position.y = 1.8 + Math.sin(t * 1.2 + 2) * 0.25
      cube2Ref.current.rotation.z = t * 0.4
    }
    if (cube3Ref.current) {
      cube3Ref.current.position.y = 2.0 + Math.sin(t * 1.8 + 4) * 0.35
      cube3Ref.current.rotation.x = t * 0.6
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main platform */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.1, 64]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Center pedestal */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Pedestal top glow ring */}
      <mesh position={[0, 1.51, 0]} castShadow>
        <boxGeometry args={[1.05, 0.02, 1.05]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} metalness={0.8} roughness={0.1} />
      </mesh>

      {/* Rotating torus knot */}
      <mesh ref={knotRef} position={[0, 2.0, 0]} castShadow name="torusknot_emerald">
        <torusKnotGeometry args={[0.4, 0.12, 128, 32]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.15} metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Gold sphere */}
      <mesh position={[1.2, 0.35, 0.8]} castShadow name="sphere_gold">
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.1} />
      </mesh>

      {/* Red octahedron */}
      <mesh position={[-1.2, 0.35, 0.8]} castShadow name="octahedron_red">
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.15} />
      </mesh>

      {/* Purple torus */}
      <mesh position={[0, 0.3, -1.4]} castShadow rotation={[Math.PI / 2, 0, 0]} name="torus_purple">
        <torusGeometry args={[0.25, 0.08, 16, 32]} />
        <meshStandardMaterial color="#8b5cf6" metalness={0.7} roughness={0.15} />
      </mesh>

      {/* Floating animated cubes */}
      <mesh ref={cube1Ref} position={[1.5, 2.2, -0.5]} castShadow name="cube_cyan">
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.2} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh ref={cube2Ref} position={[-1.5, 1.8, -0.8]} castShadow name="cube_pink">
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.2} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh ref={cube3Ref} position={[0.8, 2.0, 1.2]} castShadow name="cube_lime">
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#84cc16" emissive="#84cc16" emissiveIntensity={0.2} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Curved staircase / platform steps */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 0.8 - Math.PI * 0.4
        const r = 1.6
        const x = Math.cos(angle) * r
        const z = Math.sin(angle) * r
        const y = 0.05 + i * 0.12
        return (
          <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.1, 0.4]} />
            <meshStandardMaterial
              color={`hsl(${160 + i * 20}, 60%, ${25 + i * 5}%)`}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
        )
      })}

      {/* Point lights for visual interest */}
      <pointLight position={[2, 3, 2]} intensity={2} color="#10b981" distance={8} decay={2} />
      <pointLight position={[-2, 2, -1]} intensity={1.5} color="#f59e0b" distance={6} decay={2} />
      <pointLight position={[0, 4, -2]} intensity={1} color="#8b5cf6" distance={8} decay={2} />
    </group>
  )
}

// ─── Loaded Model (with transforms applied) ───────────────

function LoadedModel({ url, scale, position, rotation }: {
  url: string
  scale: number
  position: Vec3
  rotation: Vec3
}) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(true), [scene])

  return (
    <Center>
      <primitive
        object={cloned}
        scale={scale}
        position={position}
        rotation={rotation}
      />
    </Center>
  )
}

// ─── Error-safe model wrapper ──────────────────────────────

function SafeModelLoader({ url, scale, position, rotation }: {
  url: string
  scale: number
  position: Vec3
  rotation: Vec3
}) {
  return (
    <ErrorBoundary
      fallback={
        <group>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ef4444" wireframe />
          </mesh>
          <Html position={[0, 1.5, 0]} center>
            <div style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              Failed to load model
            </div>
          </Html>
        </group>
      }
    >
      <LoadedModel url={url} scale={scale} position={position} rotation={rotation} />
    </ErrorBoundary>
  )
}

// ─── Error Boundary for 3D ─────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    console.error('[Viewport] Model load error:', error.message)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

// ─── Click Handler for adding hotspots ────────────────────

function ClickToAddHotspot() {
  const { isAddingHotspot, addingHotspotType, addHotspot, setAddingHotspot, theme } =
    useExperienceStore()

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isAddingHotspot) return
      e.stopPropagation()
      const point = e.point
      const id = `hs_${Date.now()}`
      addHotspot({
        id,
        name: `Hotspot ${id.slice(-4)}`,
        type: addingHotspotType,
        position: [point.x, point.y, point.z] as Vec3,
        icon: '📍',
        label: 'New Hotspot',
        behaviors: [],
        visible: true,
        pulseAnimation: theme.hotspotPulseAnimation,
      })
      setAddingHotspot(false)
    },
    [isAddingHotspot, addingHotspotType, addHotspot, setAddingHotspot, theme]
  )

  if (!isAddingHotspot) return null

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      visible={false}
      onClick={handleClick}
    >
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

// ─── Camera Controller (for behavior-driven camera moves) ─

function CameraController() {
  const { camera } = useThree()
  const targetPos = useRef<THREE.Vector3 | null>(null)
  const targetLookAt = useRef<THREE.Vector3 | null>(null)
  const animDuration = useRef(0)
  const animElapsed = useRef(0)
  const startPos = useRef(new THREE.Vector3())
  const startLookAt = useRef(new THREE.Vector3())
  const isAnimating = useRef(false)

  // Expose camera control to the global execution engine
  useEffect(() => {
    ;(globalThis as Record<string, unknown>).__cameraController = {
      animateTo: (pos: Vec3, lookAt: Vec3, duration: number) => {
        startPos.current.copy(camera.position)
        startLookAt.current.set(...lookAt)
        targetPos.current = new THREE.Vector3(...pos)
        targetLookAt.current = new THREE.Vector3(...lookAt)
        animDuration.current = duration
        animElapsed.current = 0
        isAnimating.current = true
      },
      getPosition: () => camera.position.toArray() as Vec3,
      isAnimating: () => isAnimating.current,
    }
    return () => {
      delete (globalThis as Record<string, unknown>).__cameraController
    }
  }, [camera])

  useFrame((_, delta) => {
    if (targetPos.current && animDuration.current > 0) {
      animElapsed.current += delta * 1000
      const t = Math.min(animElapsed.current / animDuration.current, 1)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      camera.position.lerpVectors(startPos.current, targetPos.current, eased)
      if (targetLookAt.current) {
        camera.lookAt(
          startLookAt.current.x + (targetLookAt.current.x - startLookAt.current.x) * eased,
          startLookAt.current.y + (targetLookAt.current.y - startLookAt.current.y) * eased,
          startLookAt.current.z + (targetLookAt.current.z - startLookAt.current.z) * eased,
        )
      }
      if (t >= 1) {
        targetPos.current = null
        targetLookAt.current = null
        isAnimating.current = false
      }
    }
  })

  return null
}

// ─── Screenshot Capture Helper ─────────────────────────────

function ScreenshotCaptureHelper() {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    ;(globalThis as Record<string, unknown>).__screenshotCapture = () => {
      try {
        // Render the current frame to ensure canvas is up-to-date
        gl.render(scene, camera)
        return gl.domElement.toDataURL('image/png')
      } catch {
        return null
      }
    }

    return () => {
      delete (globalThis as Record<string, unknown>).__screenshotCapture
    }
  }, [gl, scene, camera])

  return null
}

// ─── Panorama Background Sphere ────────────────────────────

function PanoramaSphere({ url }: { url: string }) {
  const texture = useTexture(url)
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

function SafePanoramaSphere({ url }: { url: string }) {
  if (!url) return null
  return (
    <ErrorBoundary fallback={null}>
      <PanoramaSphere url={url} />
    </ErrorBoundary>
  )
}

// ─── Measurement Lines Renderer ────────────────────────────

function MeasurementLines({ measurements }: { measurements: Measurement[] }) {
  return (
    <group>
      {measurements.map((m) => (
        <MeasurementLine key={m.id} measurement={m} />
      ))}
    </group>
  )
}

function MeasurementLine({ measurement }: { measurement: Measurement }) {
  const { start, end, distance } = measurement

  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ]
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [start, end])

  const material = useMemo(() => new THREE.LineBasicMaterial({ color: '#f59e0b' }), [])

  const midPoint = useMemo((): [number, number, number] => [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.15,
    (start[2] + end[2]) / 2,
  ], [start, end])

  return (
    <group>
      <primitive object={new THREE.Line(geometry, material)} />
      {/* Start point marker */}
      <mesh position={start}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      {/* End point marker */}
      <mesh position={end}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      {/* Distance label */}
      <Html position={midPoint} center style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
        <div style={{
          background: 'rgba(245,158,11,0.9)',
          color: '#000',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}>
          {distance.toFixed(2)}m
        </div>
      </Html>
    </group>
  )
}

// ─── Measurement Click Handler ─────────────────────────────
// Uses key prop pattern: when isMeasuring changes, the inner component
// remounts fresh, naturally resetting firstPoint state.

function MeasurementClickHandler() {
  const { isMeasuring } = useExperienceStore()
  if (!isMeasuring) return null
  return <MeasurementClickHandlerInner key="measuring-active" />
}

function MeasurementClickHandlerInner() {
  const { addMeasurement } = useExperienceStore()
  const [firstPoint, setFirstPoint] = useState<Vec3 | null>(null)

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      const pt: Vec3 = [e.point.x, e.point.y, e.point.z]

      if (!firstPoint) {
        setFirstPoint(pt)
      } else {
        const dist = Math.sqrt(
          (pt[0] - firstPoint[0]) ** 2 +
          (pt[1] - firstPoint[1]) ** 2 +
          (pt[2] - firstPoint[2]) ** 2
        )
        addMeasurement({
          id: `meas_${Date.now()}`,
          start: firstPoint,
          end: pt,
          distance: dist,
        })
        setFirstPoint(null)
      }
    },
    [firstPoint, addMeasurement]
  )

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
        onClick={handleClick}
      >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Show first point indicator */}
      {firstPoint && (
        <mesh position={firstPoint}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}
    </>
  )
}

// ─── Post-Processing Effects ───────────────────────────────

function PostProcessingEffects() {
  const { theme, pathTracerEnabled } = useExperienceStore()
  const pp = theme.postProcessing || {
    bloom: false, bloomIntensity: 0.4, bloomThreshold: 0.6,
    ssao: false, ssaoRadius: 0.05, ssaoIntensity: 15,
    vignette: false, vignetteOffset: 0.1, vignetteDarkness: 0.8,
    depthOfField: false, dofFocusDistance: 0.01, dofFocalLength: 0.02, dofBokehScale: 2,
    chromaticAberration: false, caOffset: 0.002,
    toneMapping: 'aces' as const, toneMappingExposure: 1.0,
    colorGrading: false, cgBrightness: 0, cgContrast: 0, cgSaturation: 0,
    screenSpaceReflections: false, ssrIntensity: 0.5,
  }

  const {
    bloom, bloomIntensity, bloomThreshold,
    ssao, ssaoRadius, ssaoIntensity,
    vignette, vignetteOffset, vignetteDarkness,
    depthOfField, dofFocusDistance, dofFocalLength, dofBokehScale,
    chromaticAberration, caOffset,
    colorGrading,
    screenSpaceReflections,
  } = pp

  const anyEffect = bloom || ssao || vignette || depthOfField || chromaticAberration || colorGrading || screenSpaceReflections

  if (!anyEffect && !pathTracerEnabled) return null

  // Build effects array to avoid conditional rendering type issues with EffectComposer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const effects: React.ReactElement[] = []
  if (depthOfField) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={dofFocusDistance ?? 0.01}
        focalLength={dofFocalLength ?? 0.02}
        bokehScale={dofBokehScale ?? 2}
      />
    )
  }
  if (bloom) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={bloomIntensity ?? 0.4}
        luminanceThreshold={bloomThreshold ?? 0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    )
  }
  if (ssao) {
    effects.push(
      <N8AO
        key="ao"
        aoRadius={ssaoRadius ?? 0.05}
        intensity={ssaoIntensity ?? 15}
        color="black"
      />
    )
  }
  if (chromaticAberration) {
    effects.push(
      <ChromaticAberration
        key="ca"
        offset={[caOffset ?? 0.002, caOffset ?? 0.002] as unknown as THREE.Vector2}
        radialModulation={false}
        modulationOffset={0}
      />
    )
  }
  if (vignette) {
    effects.push(
      <Vignette key="vig" eskil={false} offset={vignetteOffset ?? 0.1} darkness={vignetteDarkness ?? 0.8} />
    )
  }

  return (
    <EffectComposer>
      {effects}
    </EffectComposer>
  )
}

// ─── Tone Mapping Helper ────────────────────────────────

function getToneMapping(type: string): THREE.ToneMapping {
  switch (type) {
    case 'aces': return THREE.ACESFilmicToneMapping
    case 'reinhard': return THREE.ReinhardToneMapping
    case 'cineon': return THREE.CineonToneMapping
    case 'agx': return THREE.AgXToneMapping
    case 'linear': return THREE.LinearToneMapping
    default: return THREE.ACESFilmicToneMapping
  }
}

// ─── Path Tracer Overlay ────────────────────────────────

function PathTracerOverlay() {
  const { pathTracerEnabled, pathTracerSamples, pathTracerMaxSamples, resetPathTracerSamples } = useExperienceStore()

  if (!pathTracerEnabled) return null

  const progress = Math.min(100, (pathTracerSamples / pathTracerMaxSamples) * 100)
  const isComplete = pathTracerSamples >= pathTracerMaxSamples

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[1, 0]}>
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: 'rgba(0,0,0,0.8)',
        color: isComplete ? '#10b981' : '#94a3b8',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '10px',
        fontFamily: 'monospace',
        lineHeight: 1.6,
        border: `1px solid ${isComplete ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{ color: isComplete ? '#10b981' : '#e2e8f0', fontWeight: 600 }}>
          {isComplete ? '✓ Path Trace Complete' : '◉ Path Tracing...'}
        </div>
        <div>Samples: {pathTracerSamples} / {pathTracerMaxSamples}</div>
        <div style={{ width: 100, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 4 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: isComplete ? '#10b981' : '#3b82f6', borderRadius: 2, transition: 'width 0.1s' }} />
        </div>
        {!isComplete && (
          <button
            onClick={() => resetPathTracerSamples()}
            style={{
              marginTop: 6,
              padding: '2px 8px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              color: '#94a3b8',
              fontSize: 9,
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            Reset
          </button>
        )}
        <div style={{ marginTop: 4, fontSize: 8, color: '#64748b' }}>
          GPU-accelerated · three-gpu-pathtracer
        </div>
      </div>
    </Html>
  )
}

// ─── GPU Path Tracer (three-gpu-pathtracer) ──────────────

function GPUPathTracer() {
  const { pathTracerEnabled, pathTracerMaxSamples, pathTracerSamples, resetPathTracerSamples, incrementPathTracerSamples } = useExperienceStore()
  const { gl, scene, camera } = useThree()
  const tracerRef = useRef<any>(null)
  const enabledRef = useRef(false)

  useEffect(() => {
    if (!pathTracerEnabled) {
      if (tracerRef.current) {
        try { tracerRef.current.dispose() } catch {}
        tracerRef.current = null
      }
      enabledRef.current = false
      return
    }

    // Only reinitialize if not already enabled
    if (enabledRef.current) return
    enabledRef.current = true

    resetPathTracerSamples()

    // Dynamic import to avoid SSR issues
    import('three-gpu-pathtracer').then(({ WebGLPathTracer }) => {
      try {
        const tracer = new WebGLPathTracer(gl)
        tracer.setScene(scene, camera)
        tracerRef.current = tracer
      } catch (err) {
        console.warn('[GPUPathTracer] Init failed:', err)
        enabledRef.current = false
      }
    }).catch((err) => {
      console.warn('[GPUPathTracer] Import failed:', err)
      enabledRef.current = false
    })

    return () => {
      if (tracerRef.current) {
        try { tracerRef.current.dispose() } catch {}
        tracerRef.current = null
      }
      enabledRef.current = false
    }
  }, [pathTracerEnabled, gl, scene, camera, resetPathTracerSamples])

  useFrame(() => {
    if (!pathTracerEnabled || !tracerRef.current || !enabledRef.current) return
    if (pathTracerSamples < pathTracerMaxSamples) {
      try {
        tracerRef.current.renderSample()
        incrementPathTracerSamples()
      } catch {
        // Silently handle render errors
      }
    }
  })

  return null
}

// ─── Hotspot Transform Controls (single unified component) ────

function HotspotTransformControls() {
  const { selectedHotspotId, hotspots, updateHotspot, isPreviewMode } = useExperienceStore()
  const controlsRef = useRef<any>(null)
  const objectRef = useRef<THREE.Group>(null)
  const selectedHotspot = hotspots.find((h) => h.id === selectedHotspotId)
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<TransformMode>(transformModeState.getMode())

  useEffect(() => {
    return transformModeState.subscribe(() => {
      setMode(transformModeState.getMode())
    })
  }, [])

  // Only reset position when hotspot ID changes (not on every position update from drag)
  useEffect(() => {
    if (objectRef.current && selectedHotspot) {
      objectRef.current.position.set(...selectedHotspot.position)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotspot?.id])

  // Listen for transform changes and sync back to store
  useEffect(() => {
    if (!controlsRef.current || !selectedHotspot || isPreviewMode || selectedHotspot.type === '2D') return
    const controls = controlsRef.current

    const onObjectChange = () => {
      if (objectRef.current) {
        const pos = objectRef.current.position
        updateHotspot(selectedHotspot.id, { position: [pos.x, pos.y, pos.z] as Vec3 })
      }
    }
    const onDraggingChanged = (event: { value: boolean }) => {
      setIsDragging(event.value)
    }

    controls.addEventListener('objectChange', onObjectChange)
    controls.addEventListener('dragging-changed', onDraggingChanged)
    return () => {
      controls.removeEventListener('objectChange', onObjectChange)
      controls.removeEventListener('dragging-changed', onDraggingChanged)
    }
  }, [selectedHotspotId, selectedHotspot, isPreviewMode, updateHotspot])

  if (!selectedHotspot || isPreviewMode || selectedHotspot.type === '2D') return null

  return (
    <TransformControls
      ref={controlsRef}
      size={0.7}
      mode={mode}
      showX
      showY
      showZ
    >
      <group ref={objectRef} position={selectedHotspot.position}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={isDragging ? '#f59e0b' : '#10b981'}
            emissive={isDragging ? '#f59e0b' : '#10b981'}
            emissiveIntensity={0.5}
            transparent
            opacity={0.85}
          />
        </mesh>
        {isDragging && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.18, 0.22, 32]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </TransformControls>
  )
}

// ─── Global Transform Mode (shared with toolbar) ──────────

type TransformMode = 'translate' | 'rotate' | 'scale'

const transformModeState = {
  mode: 'translate' as TransformMode,
  listeners: new Set<() => void>(),
  setMode(mode: TransformMode) {
    transformModeState.mode = mode
    transformModeState.listeners.forEach((l) => l())
  },
  getMode(): TransformMode {
    return transformModeState.mode
  },
  subscribe(listener: () => void) {
    transformModeState.listeners.add(listener)
    return () => { transformModeState.listeners.delete(listener) }
  },
}

// Expose to other components (like EditorLayout toolbar)
if (typeof window !== 'undefined') {
  ;(globalThis as Record<string, unknown>).__transformMode = transformModeState
}

// ─── Object Transform Controls (for scene nodes) ──────────

function ObjectTransformControls() {
  const { selectedNodeId, selectedHotspotId, sceneNodes, isPreviewMode } = useExperienceStore()
  const { scene } = useThree()
  const controlsRef = useRef<any>(null)
  const [mode, setMode] = useState<TransformMode>(transformModeState.getMode())
  const [isDragging, setIsDragging] = useState(false)

  // Subscribe to transform mode changes from toolbar
  useEffect(() => {
    return transformModeState.subscribe(() => {
      setMode(transformModeState.getMode())
    })
  }, [])

  // Find the 3D object matching the selected node
  const targetObject = useMemo(() => {
    if (!selectedNodeId || selectedHotspotId || isPreviewMode) return null
    // Find the scene node
    const node = findNodeById(sceneNodes, selectedNodeId)
    if (!node || node.type === 'light' || node.type === 'camera') return null

    // Try demo scene mapping first
    const demoMeshName = demoNodeToMeshName[selectedNodeId]
    let found: THREE.Object3D | null = null

    scene.traverse((obj) => {
      if (found) return
      // Demo scene match
      if (demoMeshName && obj.name === demoMeshName) {
        found = obj
        return
      }
      // Match by scene node name
      if (obj.name === node.name) {
        found = obj
        return
      }
      // Match by UUID stored in userData
      if (node.userData?.uuid && obj.uuid === node.userData.uuid) {
        found = obj
        return
      }
      // Match by mesh name stored in userData
      if (node.userData?.meshName && obj.name === node.userData.meshName) {
        found = obj
        return
      }
    })

    return found
  }, [selectedNodeId, selectedHotspotId, isPreviewMode, sceneNodes, scene])

  // Listen for transform changes
  useEffect(() => {
    if (!controlsRef.current || !targetObject) return
    const controls = controlsRef.current

    const onDraggingChanged = (event: { value: boolean }) => {
      setIsDragging(event.value)
    }

    controls.addEventListener('dragging-changed', onDraggingChanged)
    return () => {
      controls.removeEventListener('dragging-changed', onDraggingChanged)
    }
  }, [targetObject])

  if (!targetObject) return null

  return (
    <TransformControls
      ref={controlsRef}
      object={targetObject}
      mode={mode}
      size={0.6}
      showX
      showY
      showZ
    />
  )
}

// Helper to find a node in the tree by ID
function findNodeById(nodes: SceneNode[], id: string): SceneNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNodeById(n.children, id)
      if (found) return found
    }
  }
  return null
}

// ─── Scene Node Visibility Sync ─────────────────────────────

// Map from scene node IDs to mesh names in the demo scene
const demoNodeToMeshName: Record<string, string> = {
  demo_torusknot: 'torusknot_emerald',
  demo_sphere_gold: 'sphere_gold',
  demo_octahedron_red: 'octahedron_red',
  demo_torus_purple: 'torus_purple',
  demo_cube_cyan: 'cube_cyan',
  demo_cube_pink: 'cube_pink',
  demo_cube_lime: 'cube_lime',
}

function SceneNodeVisibilitySync() {
  const { sceneNodes, model } = useExperienceStore()
  const { scene } = useThree()

  useEffect(() => {
    if (sceneNodes.length === 0) return

    const hiddenIds = new Set<string>()
    // Also collect name/uuid -> id mappings from all scene nodes
    const nameToNodeId: Record<string, string> = {}
    const uuidToNodeId: Record<string, string> = {}
    const meshNameToNodeId: Record<string, string> = {}

    function collectHiddenAndMappings(nodes: typeof sceneNodes) {
      for (const n of nodes) {
        if (!n.visible) hiddenIds.add(n.id)
        // Build name mapping
        if (n.name) nameToNodeId[n.name] = n.id
        // Build uuid mapping from userData
        if (n.userData?.uuid) uuidToNodeId[n.userData.uuid as string] = n.id
        // Build meshName mapping from userData
        if (n.userData?.meshName) meshNameToNodeId[n.userData.meshName as string] = n.id
        if (n.children) collectHiddenAndMappings(n.children)
      }
    }
    collectHiddenAndMappings(sceneNodes)

    // Also add demo scene mappings for backward compatibility
    for (const [nodeId, meshName] of Object.entries(demoNodeToMeshName)) {
      meshNameToNodeId[meshName] = nodeId
    }

    scene.traverse((obj) => {
      // Check demo scene match by mesh name
      if (obj.name && obj.name in meshNameToNodeId) {
        const nodeId = meshNameToNodeId[obj.name]
        obj.visible = !hiddenIds.has(nodeId)
        return
      }
      // Check match by object name to scene node name
      if (obj.name && obj.name in nameToNodeId) {
        const nodeId = nameToNodeId[obj.name]
        obj.visible = !hiddenIds.has(nodeId)
        return
      }
      // Check match by UUID
      if (obj.uuid && obj.uuid in uuidToNodeId) {
        const nodeId = uuidToNodeId[obj.uuid]
        obj.visible = !hiddenIds.has(nodeId)
        return
      }
    })
  }, [sceneNodes, scene, model])

  return null
}

// ─── Execute behaviors in preview mode ────────────────────

function executeBehaviors(hotspotId: string, trigger: 'onClick' | 'onHover' | 'onProximity' = 'onClick') {
  const state = useExperienceStore.getState()
  const hotspot = state.hotspots.find((h) => h.id === hotspotId)
  if (!hotspot) return
  for (const behavior of hotspot.behaviors) {
    if (behavior.trigger === trigger) {
      for (const action of behavior.actions) {
        executeAction(action)
      }
    }
  }
}

function evaluateCondition(condition: string | undefined): boolean {
  if (!condition) return true // No condition = always execute

  const state = useExperienceStore.getState()

  try {
    // Replace variable names with their values from the store
    let expr = condition.trim()
    for (const v of state.variables) {
      const regex = new RegExp(`\\b${escapeRegex(v.name)}\\b`, 'g')
      expr = expr.replace(regex, JSON.stringify(v.value))
    }
    return safeEval(expr)
  } catch {
    console.warn('[Condition] Failed to evaluate:', condition)
    return true // If evaluation fails, execute anyway
  }
}

// Escape special regex characters in variable names
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Safe expression evaluator — only allows comparison and logical operators
// Supports: ===, !==, >, <, >=, <=, &&, ||, !, true, false, numbers, quoted strings
function safeEval(expr: string): boolean {
  // Whitelist: only allow safe tokens
  // Tokens: numbers, booleans, strings in quotes, comparison/logical operators, parens, whitespace
  const safePattern = /^(?:\s*(?:true|false|(?:\d+(?:\.\d+)?)|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|===|!==|>=|<=|>|<|&&|\|\||!|\(|\))\s*)+$/
  if (!safePattern.test(expr)) {
    console.warn('[Condition] Unsafe expression rejected:', expr)
    return false
  }
  try {
    // Now it's safe to evaluate — only whitelisted tokens are present
    const result = new Function(`return (${expr})`)()
    return !!result
  } catch {
    return false
  }
}

function executeAction(action: ActionDef) {
  // Check condition before executing
  if (!evaluateCondition(action.condition)) return

  const state = useExperienceStore.getState()

  switch (action.type) {
    case 'camera': {
      const ctrl = (globalThis as Record<string, unknown>).__cameraController as {
        animateTo: (pos: Vec3, lookAt: Vec3, duration: number) => void
        getPosition: () => Vec3
      } | undefined
      if (!ctrl) break
      if (action.action === 'focusOn') {
        const target: Vec3 = action.position || [0, 0, 0]
        const offset: Vec3 = action.offset || [0, 2, 5]
        ctrl.animateTo(
          [target[0] + offset[0], target[1] + offset[1], target[2] + offset[2]],
          target,
          action.duration || 1000
        )
      } else if (action.action === 'moveTo') {
        ctrl.animateTo(
          action.position || [5, 3, 5],
          action.lookAt || [0, 0, 0],
          action.duration || 1000
        )
      } else if (action.action === 'orbit') {
        const center = action.position || [0, 0, 0]
        const radius = 5
        const speed = action.speed || 0.5
        let angle = 0
        const orbitInterval = setInterval(() => {
          const ctrl2 = (globalThis as Record<string, unknown>).__cameraController as {
            animateTo: (pos: Vec3, lookAt: Vec3, duration: number) => void
          } | undefined
          if (!ctrl2) { clearInterval(orbitInterval); return }
          angle += speed * 0.05
          ctrl2.animateTo(
            [center[0] + Math.cos(angle) * radius, center[1] + 2, center[2] + Math.sin(angle) * radius],
            center,
            50
          )
        }, 50)
        setTimeout(() => clearInterval(orbitInterval), action.duration || 5000)
      }
      break
    }

    case 'visibility': {
      const targetId = action.target
      if (targetId) {
        const targetHotspot = state.hotspots.find((h) => h.id === targetId || h.name === targetId)
        if (targetHotspot) {
          useExperienceStore.getState().updateHotspot(targetHotspot.id, {
            visible: action.visibilityAction === 'show' ? true :
                     action.visibilityAction === 'hide' ? false :
                     !targetHotspot.visible
          })
        }
      }
      break
    }

    case 'material': {
      // Actually modify material properties on 3D scene objects
      const sceneRef = (globalThis as Record<string, unknown>).__r3fScene as THREE.Scene | undefined
      if (sceneRef && action.target) {
        sceneRef.traverse((obj) => {
          if (obj.name === action.target || (obj as THREE.Mesh).material) {
            const mesh = obj as THREE.Mesh
            if (mesh.material && mesh.name === action.target) {
              const mat = mesh.material as THREE.MeshStandardMaterial
              if (action.property === 'color' && action.value) {
                mat.color.set(action.value as string)
              } else if (action.property === 'emissive' && action.value) {
                mat.emissive.set(action.value as string)
              } else if (action.property === 'emissiveIntensity' && typeof action.value === 'number') {
                mat.emissiveIntensity = action.value
              } else if (action.property === 'metalness' && typeof action.value === 'number') {
                mat.metalness = action.value
              } else if (action.property === 'roughness' && typeof action.value === 'number') {
                mat.roughness = action.value
              } else if (action.property === 'opacity' && typeof action.value === 'number') {
                mat.opacity = action.value
                mat.transparent = action.value < 1
              } else if (action.property === 'wireframe' && typeof action.value === 'boolean') {
                mat.wireframe = action.value
              } else if (action.property && action.value !== undefined) {
                // Generic property set via (mat as any)[property] = value
                try { (mat as unknown as Record<string, unknown>)[action.property!] = action.value } catch {}
              }
            }
          }
        })
      }
      useExperienceStore.getState().addPreviewToast({
        id: `mat_${Date.now()}`,
        message: `Material: ${action.property} = ${action.value} on ${action.target || 'selection'}`,
        type: 'info',
      })
      break
    }

    case 'animation': {
      // Actually play/pause GLTF animations using the AnimationMixer
      const mixerRef = (globalThis as Record<string, unknown>).__animationMixer as {
        play: (name: string, loop?: boolean) => void
        stop: (name: string) => void
        stopAll: () => void
      } | undefined
      if (action.action === 'play') {
        mixerRef?.play(action.animationName || 'default', action.loop)
      } else if (action.action === 'stop') {
        mixerRef?.stop(action.animationName || 'default')
      } else if (action.action === 'stopAll') {
        mixerRef?.stopAll()
      }
      useExperienceStore.getState().addPreviewToast({
        id: `anim_${Date.now()}`,
        message: `Animation: ${action.action} "${action.animationName || 'default'}"`,
        type: action.action === 'play' ? 'success' : 'info',
      })
      break
    }

    case 'lighting': {
      if (action.action === 'changeEnvironment' && action.hdri) {
        useExperienceStore.getState().setEnvironment({ preset: action.hdri })
      }
      if (action.intensity !== undefined) {
        useExperienceStore.getState().setEnvironment({ intensity: action.intensity })
      }
      break
    }

    case 'ui': {
      if (action.action === 'showPanel' && action.panelId) {
        useExperienceStore.getState().setActivePreviewPanel(action.panelId)
      } else if (action.action === 'hidePanel') {
        useExperienceStore.getState().setActivePreviewPanel(null)
      } else if (action.action === 'updateVariable' && action.variable) {
        // Actually update the variable value in the store
        const vars = useExperienceStore.getState().variables
        const targetVar = vars.find((v) => v.id === action.variable || v.name === action.variable)
        if (targetVar) {
          const newValue = action.value !== undefined ? action.value : action.content
          useExperienceStore.getState().updateVariable(targetVar.id, { value: newValue as string | number | boolean })
        }
        useExperienceStore.getState().addPreviewToast({
          id: `var_${Date.now()}`,
          message: `Set ${action.variable} = ${action.value || action.content || ''}`,
          type: 'success',
        })
      }
      break
    }

    case 'variant': {
      // Actually switch material variants on scene objects
      const sceneRef2 = (globalThis as Record<string, unknown>).__r3fScene as THREE.Scene | undefined
      if (sceneRef2 && action.affects) {
        // Apply variant by modifying specified materials/meshes
        if (action.affects.materials) {
          sceneRef2.traverse((obj) => {
            const mesh = obj as unknown as THREE.Mesh
            if (mesh.material && action.affects?.materials?.includes(mesh.name)) {
              const mat = mesh.material as THREE.MeshStandardMaterial
              // Apply variant properties based on variantName
              if (action.variantName) {
                // Variant switching toggles visibility of specified meshes
                mesh.visible = true
              }
            }
          })
        }
        if (action.affects.meshes) {
          sceneRef2.traverse((obj) => {
            if (action.affects?.meshes?.includes(obj.name)) {
              obj.visible = !obj.visible
            }
          })
        }
      }
      useExperienceStore.getState().addPreviewToast({
        id: `var_${Date.now()}`,
        message: `Switched to variant: ${action.variantName || 'default'}`,
        type: 'info',
      })
      break
    }

    case 'transform': {
      // Actually transform scene objects
      const sceneRef3 = (globalThis as Record<string, unknown>).__r3fScene as THREE.Scene | undefined
      if (sceneRef3 && action.target) {
        let foundObj: THREE.Object3D | undefined
        sceneRef3.traverse((obj) => {
          if (obj.name === action.target && !foundObj) foundObj = obj
        })
        if (foundObj) {
          if (action.translate) {
            foundObj.position.add(new THREE.Vector3(...action.translate))
          }
          if (action.rotate) {
            foundObj.rotation.x += THREE.MathUtils.degToRad(action.rotate[0])
            foundObj.rotation.y += THREE.MathUtils.degToRad(action.rotate[1])
            foundObj.rotation.z += THREE.MathUtils.degToRad(action.rotate[2])
          }
          if (action.scale) {
            foundObj.scale.multiply(new THREE.Vector3(...action.scale))
          }
        }
      }
      useExperienceStore.getState().addPreviewToast({
        id: `xform_${Date.now()}`,
        message: `Transform: move(${action.translate?.join(', ')}) rotate(${action.rotate?.join(', ')}) scale(${action.scale?.join(', ')})`,
        type: 'info',
      })
      break
    }

    default:
      console.log('[Preview] Unknown action:', action.type)
  }
}

// ─── Viewport Overlay Controls ────────────────────────────

function ViewportOverlayControls() {
  const { theme, setShowGrid, showGrid, showStats, setShowStats, isPreviewMode, cameraBookmarks, setCamera } = useExperienceStore()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const zoomIn = useCallback(() => {
    const ctrl = (globalThis as Record<string, unknown>).__cameraController as {
      animateTo: (pos: Vec3, lookAt: Vec3, duration: number) => void
      getPosition: () => Vec3
    } | undefined
    if (ctrl) {
      const pos = ctrl.getPosition()
      const dir = [0, 0, 0].map((_, i) => pos[i] * 0.8) as Vec3
      ctrl.animateTo(dir, [0, 0, 0], 300)
    }
  }, [])

  const zoomOut = useCallback(() => {
    const ctrl = (globalThis as Record<string, unknown>).__cameraController as {
      animateTo: (pos: Vec3, lookAt: Vec3, duration: number) => void
      getPosition: () => Vec3
    } | undefined
    if (ctrl) {
      const pos = ctrl.getPosition()
      const dir = [0, 0, 0].map((_, i) => pos[i] * 1.25) as Vec3
      ctrl.animateTo(dir, [0, 0, 0], 300)
    }
  }, [])

  return (
    <>
      {/* Bottom-left viewport controls */}
      {!isPreviewMode && (
        <div className="absolute bottom-4 left-4 z-40 flex flex-col gap-1.5">
          <ViewportButton icon="⊞" label="Grid" active={showGrid} onClick={() => setShowGrid(!showGrid)} />
          <ViewportButton icon="📊" label="Stats" active={showStats} onClick={() => setShowStats(!showStats)} />
        </div>
      )}

      {/* Right-side zoom/controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1">
        {theme.showZoomButtons && (
          <>
            <button
              onClick={zoomIn}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs font-bold transition-colors"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={zoomOut}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs font-bold transition-colors"
              title="Zoom Out"
            >
              −
            </button>
          </>
        )}
        {theme.showFullscreenButton && (
          <button
            onClick={toggleFullscreen}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⤓' : '⤒'}
          </button>
        )}
      </div>

      {/* Camera bookmarks bar */}
      {cameraBookmarks.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-1">
          {cameraBookmarks.map((bm) => (
            <button
              key={bm.id}
              onClick={() => {
                const ctrl = (globalThis as Record<string, unknown>).__cameraController as {
                  animateTo: (pos: Vec3, lookAt: Vec3, duration: number) => void
                } | undefined
                ctrl?.animateTo(bm.position, bm.target, 800)
              }}
              className="px-2.5 py-1 rounded-md bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-[10px] font-medium transition-colors border border-white/10"
              title={`${bm.position.join(', ')} → ${bm.target.join(', ')}`}
            >
              📷 {bm.name}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Preview Toast Display ────────────────────────────────

function PreviewToastDisplay() {
  const { previewToasts, removePreviewToast } = useExperienceStore()

  useEffect(() => {
    // Auto-remove toasts after 3 seconds
    const timer = setInterval(() => {
      const toasts = useExperienceStore.getState().previewToasts
      toasts.forEach((t) => {
        setTimeout(() => removePreviewToast(t.id), 3000)
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [removePreviewToast])

  if (previewToasts.length === 0) return null

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
      {previewToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-3 py-2 rounded-lg text-xs font-medium shadow-lg backdrop-blur-sm animate-in slide-in-from-right
            ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              toast.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-blue-500/20 text-blue-300 border border-blue-500/30'}
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

// ─── Preview Panel Display ────────────────────────────────

function PreviewPanelDisplay() {
  const { activePreviewPanel, uiPanels, setActivePreviewPanel } = useExperienceStore()

  if (!activePreviewPanel) return null

  const panel = uiPanels.find((p) => p.id === activePreviewPanel)
  if (!panel) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-slate-200">{panel.title}</h3>
          <button
            onClick={() => setActivePreviewPanel(null)}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-6">
          <p className="text-sm text-slate-400">{panel.content}</p>
        </div>
        <div className="px-4 py-3 border-t border-white/5 flex justify-end">
          <button
            onClick={() => setActivePreviewPanel(null)}
            className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dynamic Light Renderer ─────────────────────────────────

function DynamicLights() {
  const { lights } = useExperienceStore()
  return (
    <>
      {lights.map((l: LightConfig) => {
        if (l.type === 'ambient') return <ambientLight key={l.id} color={l.color} intensity={l.intensity} />
        if (l.type === 'directional') return (
          <group key={l.id}>
            <directionalLight
              color={l.color}
              intensity={l.intensity}
              position={l.position}
              castShadow={l.castShadow}
              shadow-mapSize={[2048, 2048]}
            />
            <LightHelper type="directional" position={l.position} color={l.color} />
          </group>
        )
        if (l.type === 'point') return (
          <group key={l.id}>
            <pointLight color={l.color} intensity={l.intensity} position={l.position} castShadow={l.castShadow} decay={2} />
            <LightHelper type="point" position={l.position} color={l.color} />
          </group>
        )
        if (l.type === 'spot') return (
          <group key={l.id}>
            <SpotLight color={l.color} intensity={l.intensity} position={l.position} angle={l.angle || 0.5} penumbra={l.penumbra || 0} castShadow={l.castShadow} />
            <LightHelper type="spot" position={l.position} color={l.color} />
          </group>
        )
        if (l.type === 'hemisphere') return (
          <hemisphereLight key={l.id} color={l.color} groundColor={l.groundColor || '#444444'} intensity={l.intensity} position={l.position} />
        )
        return null
      })}
    </>
  )
}

// Light helper gizmo - small indicator showing light position and type
function LightHelper({ type, position, color }: { type: string; position: Vec3; color: string }) {
  const { isPreviewMode } = useExperienceStore()
  if (isPreviewMode) return null // Hide helpers in preview mode

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>
      {/* Direction indicator line */}
      {type === 'directional' && (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.04, 0.15, 4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
      {type === 'point' && (
        <>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <ringGeometry args={[0.1, 0.12, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 0.12, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  )
}

// ─── Annotation Marker ──────────────────────────────────────

function AnnotationMarker({ annotation }: { annotation: Annotation }) {
  const { updateAnnotation, removeAnnotation, selectAnnotation, selectedAnnotationId } = useExperienceStore()
  const [hovered, setHovered] = useState(false)
  const isSelected = selectedAnnotationId === annotation.id

  return (
    <group position={annotation.position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          selectAnnotation(isSelected ? null : annotation.id)
        }}
      >
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial
          color={annotation.color}
          emissive={annotation.color}
          emissiveIntensity={hovered || isSelected ? 0.8 : 0.3}
        />
      </mesh>
      {(hovered || isSelected) && (
        <Html position={[0, 0.25, 0]} center style={{ pointerEvents: 'auto' }} zIndexRange={[100, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            border: `1px solid ${annotation.color}`,
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            maxWidth: '200px',
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: annotation.color }}>{annotation.title}</div>
            <div style={{ color: '#94a3b8', lineHeight: 1.4 }}>{annotation.content}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                onClick={(e) => { e.stopPropagation(); selectAnnotation(annotation.id) }}
                style={{ fontSize: 10, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeAnnotation(annotation.id) }}
                style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── Scene Stats Overlay ────────────────────────────────────

function SceneStatsOverlay() {
  const { showStats } = useExperienceStore()
  const { gl } = useThree()
  const [fps, setFps] = useState(0)
  const [frames, setFrames] = useState(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    if (!showStats) return
    setFrames((f) => f + 1)
    const now = performance.now()
    if (now - lastTime.current >= 1000) {
      setFps(frames)
      setFrames(0)
      lastTime.current = now
    }
  })

  if (!showStats) return null

  const info = gl.info
  const triangles = info.render?.triangles || 0
  const drawCalls = info.render?.calls || 0

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[1, 0]}>
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        background: 'rgba(0,0,0,0.75)',
        color: '#94a3b8',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '10px',
        fontFamily: 'monospace',
        lineHeight: 1.6,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ color: fps >= 50 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ef4444' }}>
          FPS: {fps}
        </div>
        <div>Triangles: {triangles.toLocaleString()}</div>
        <div>Draw Calls: {drawCalls}</div>
        <div>Renderer: WebGL2</div>
      </div>
    </Html>
  )
}

// ─── Animated OrbitControls (disables during camera animation) ──

function AnimatedOrbitControls(props: any) {
  const controlsRef = useRef<any>(null)

  useFrame(() => {
    if (controlsRef.current) {
      const ctrl = (globalThis as Record<string, unknown>).__cameraController as any
      controlsRef.current.enabled = !ctrl?.isAnimating?.() && props.enabled !== false
      // Expose the orbit controls target for annotation placement
      ;(globalThis as Record<string, unknown>).__orbitControlsTarget = controlsRef.current.target
    }
  })

  return <OrbitControls ref={controlsRef} {...props} />
}

// ─── Scene Reference Exposer ─────────────────────────────
// Exposes the Three.js scene on globalThis so action handlers can traverse/modify it

function SceneRefExposer() {
  const { scene } = useThree()

  useEffect(() => {
    ;(globalThis as Record<string, unknown>).__r3fScene = scene
    return () => {
      delete (globalThis as Record<string, unknown>).__r3fScene
    }
  }, [scene])

  return null
}

// ─── Animation Mixer Helper ──────────────────────────────
// Sets up AnimationMixer for loaded GLTF models and exposes play/stop on globalThis

function AnimationMixerHelper() {
  const { scene } = useThree()
  const model = useExperienceStore((s) => s.model)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionsMapRef = useRef<Map<string, THREE.AnimationAction>>(new Map())

  useEffect(() => {
    if (!model) {
      mixerRef.current = null
      actionsMapRef.current = new Map()
      return
    }

    // Find animation clips in the loaded scene
    const clips: THREE.AnimationClip[] = []
    scene.traverse((obj) => {
      const anyObj = obj as unknown as Record<string, unknown>
      if (anyObj.animations && Array.isArray(anyObj.animations)) {
        clips.push(...(anyObj.animations as THREE.AnimationClip[]))
      }
    })

    if (clips.length === 0) return

    const mixer = new THREE.AnimationMixer(scene)
    mixerRef.current = mixer
    const currentActions = new Map<string, THREE.AnimationAction>()

    for (const clip of clips) {
      const action = mixer.clipAction(clip)
      currentActions.set(clip.name, action)
    }
    actionsMapRef.current = currentActions

    // Expose animation control API
    ;(globalThis as Record<string, unknown>).__animationMixer = {
      play: (name: string, loop?: boolean) => {
        const action = actionsMapRef.current.get(name)
        if (action) {
          action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
          action.reset().play()
        } else {
          // If name is 'default', play the first clip
          const firstAction = actionsMapRef.current.values().next().value as THREE.AnimationAction | undefined
          if (firstAction) {
            firstAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
            firstAction.reset().play()
          }
        }
      },
      stop: (name: string) => {
        const action = actionsMapRef.current.get(name)
        if (action) {
          action.stop()
        }
      },
      stopAll: () => {
        mixer.stopAllAction()
      },
    }

    return () => {
      mixer.stopAllAction()
      mixerRef.current = null
      actionsMapRef.current = new Map()
      delete (globalThis as Record<string, unknown>).__animationMixer
    }
  }, [model, scene])

  // Update mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  return null
}

// ─── Main Viewport ────────────────────────────────────────

export function Viewport3D() {
  const {
    model,
    hotspots,
    environment,
    camera: camConfig,
    theme,
    isPreviewMode,
    isAddingHotspot,
    isMeasuring,
    showGrid,
    showStats,
    selectedHotspotId,
    selectHotspot,
    setSidebarTab,
    setPropertiesTab,
    measurements,
    annotations,
    lights,
  } = useExperienceStore()

  return (
    <div className="relative w-full h-full bg-slate-950">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          toneMapping: getToneMapping(theme.postProcessing?.toneMapping || 'aces'),
          toneMappingExposure: theme.postProcessing?.toneMappingExposure ?? 1.0,
        }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
        camera={{
          position: camConfig.initialPosition,
          fov: camConfig.fov,
          near: camConfig.near,
          far: camConfig.far,
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <DynamicLights />

          {/* Environment */}
          {environment.type === 'hdri' && environment.preset && (
            <Environment preset={environment.preset as 'studio' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'park' | 'city'} background={false} />
          )}
          {environment.type === 'color' && environment.color && (
            <color attach="background" args={[environment.color]} />
          )}
          {environment.type === 'panorama' && environment.url && (
            <SafePanoramaSphere url={environment.url} />
          )}
          {!model && environment.type !== 'panorama' && <color attach="background" args={['#0c1222']} />}

          {/* Grid */}
          {showGrid && !isPreviewMode && (
            <Grid infiniteGrid cellSize={0.5} sectionSize={2} cellColor="#1e293b" sectionColor="#334155" fadeDistance={30} position={[0, -0.01, 0]} />
          )}

          {/* Model or Demo */}
          {model ? (
            <SafeModelLoader
              url={model.url}
              scale={model.scale}
              position={model.position}
              rotation={model.rotation}
            />
          ) : (
            <DemoScene />
          )}

          <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={10} blur={2} far={4} />

          {/* Hotspots */}
          {hotspots.filter((h) => h.visible).map((h) => (
            <HotspotMarker
              key={h.id}
              hotspot={h}
              iconColor={theme.hotspotIconColor}
              labelStyle={theme.hotspotLabelStyle}
              isSelected={selectedHotspotId === h.id}
              isPreview={isPreviewMode}
              onClick={() => {
                if (!isPreviewMode) {
                  selectHotspot(h.id)
                  setSidebarTab('hotspots')
                  setPropertiesTab('hotspot')
                }
              }}
            />
          ))}

          {/* Measurement lines */}
          {measurements.length > 0 && <MeasurementLines measurements={measurements} />}

          {/* Scene Reference Exposer - makes the Three.js scene accessible to action handlers */}
          <SceneRefExposer />
          <AnimationMixerHelper />

          <ClickToAddHotspot />
          <MeasurementClickHandler />
          <CameraController />
          <ScreenshotCaptureHelper />
          <HotspotTransformControls />
          <ObjectTransformControls />
          <SceneNodeVisibilitySync />
          <PostProcessingEffects />
          <GPUPathTracer />
          <PathTracerOverlay />
          <SceneStatsOverlay />

          {/* Annotations */}
          {annotations.filter((a: Annotation) => a.visible).map((a: Annotation) => (
            <AnnotationMarker key={a.id} annotation={a} />
          ))}

          {/* Controls */}
          <AnimatedOrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.1}
            target={camConfig.initialTarget}
            enabled={!isAddingHotspot && !isMeasuring}
          />

          {!isPreviewMode && (
            <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
              <GizmoViewport axisColors={['#f43f5e', '#22c55e', '#3b82f6']} labelColor="white" />
            </GizmoHelper>
          )}
        </Suspense>
      </Canvas>

      {/* Adding hotspot overlay */}
      {isAddingHotspot && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <span className="text-sm font-medium">Click on the scene to place hotspot</span>
            <button
              className="ml-2 bg-white/20 hover:bg-white/30 rounded px-2 py-0.5 text-xs"
              onClick={() => useExperienceStore.getState().setAddingHotspot(false)}
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Measuring overlay */}
      {isMeasuring && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-amber-500 text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <span className="text-sm font-medium">Click two points to measure distance</span>
            <button
              className="ml-2 bg-black/20 hover:bg-black/30 rounded px-2 py-0.5 text-xs font-medium"
              onClick={() => useExperienceStore.getState().setMeasuring(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Viewport controls overlay */}
      <ViewportOverlayControls />

      {/* Preview mode toasts */}
      {isPreviewMode && <PreviewToastDisplay />}

      {/* Preview mode panels */}
      {isPreviewMode && <PreviewPanelDisplay />}

      {/* Preview mode banner */}
      {isPreviewMode && (
        <div className="absolute top-0 left-0 right-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-center z-40">
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
            ▶ Preview Mode — Click hotspots to test interactions
          </span>
        </div>
      )}

      <Loader />
    </div>
  )
}

function ViewportButton({ icon, label, active, onClick }: {
  icon: string; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
      }`}
      title={label}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
