'use client'

import React, { useState } from 'react'
import { useExperienceStore, type SkinPreset, type LightConfig } from '@/store/experience-store'
import { HexColorPicker } from 'react-colorful'
import {
  Sparkles,
  Briefcase,
  Building2,
  Landmark,
  Sliders,
  Sun,
  Aperture,
  Eye,
  Lightbulb,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Focus,
  Palette,
  Zap,
  Monitor,
} from 'lucide-react'

const skinPresets: {
  id: SkinPreset
  name: string
  description: string
  icon: React.ReactNode
  preview: { primary: string; bg: string; accent: string }
}[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, subtle UI with smooth interactions',
    icon: <Sparkles size={16} />,
    preview: { primary: '#10b981', bg: '#0f172a', accent: '#334155' },
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Vibrant, animated with bold colors',
    icon: <Sliders size={16} />,
    preview: { primary: '#f59e0b', bg: '#1a1a2e', accent: '#ef4444' },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional, branded appearance',
    icon: <Briefcase size={16} />,
    preview: { primary: '#3b82f6', bg: '#f8fafc', accent: '#64748b' },
  },
  {
    id: 'museum',
    name: 'Museum',
    description: 'Elegant, informative display style',
    icon: <Landmark size={16} />,
    preview: { primary: '#a855f7', bg: '#1c1917', accent: '#78716c' },
  },
]

export function ThemePanel() {
  const { theme, setTheme, applySkinPreset, environment, setEnvironment } =
    useExperienceStore()
  const [colorKey, setColorKey] = useState<string | null>(null)

  const pp = theme.postProcessing || {}

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Theme & Environment
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Skin Presets */}
        <div className="px-3 py-3 border-b border-white/5">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
            Skin Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {skinPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applySkinPreset(preset.id)}
                className={`
                  text-left p-2 rounded-lg border transition-all
                  ${theme.hotspotStyle === preset.id
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/5 hover:border-white/10 bg-slate-800/30'
                  }
                `}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-4 h-4 rounded-full border border-white/10"
                    style={{ backgroundColor: preset.preview.primary }}
                  />
                  <span className="text-[10px] font-medium text-slate-300">
                    {preset.name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: preset.preview.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: preset.preview.bg }}
                  />
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: preset.preview.accent }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Settings */}
        <div className="px-3 py-3 border-b border-white/5 space-y-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Colors
          </label>

          <ColorField
            label="Primary Color"
            value={theme.primaryColor}
            colorKey="primaryColor"
            activeKey={colorKey}
            onSelectKey={setColorKey}
            onChange={(v) => setTheme({ primaryColor: v })}
          />
          <ColorField
            label="Secondary Color"
            value={theme.secondaryColor}
            colorKey="secondaryColor"
            activeKey={colorKey}
            onSelectKey={setColorKey}
            onChange={(v) => setTheme({ secondaryColor: v })}
          />
          <ColorField
            label="Background"
            value={theme.backgroundColor}
            colorKey="backgroundColor"
            activeKey={colorKey}
            onSelectKey={setColorKey}
            onChange={(v) => setTheme({ backgroundColor: v })}
          />
          <ColorField
            label="Hotspot Icon"
            value={theme.hotspotIconColor}
            colorKey="hotspotIconColor"
            activeKey={colorKey}
            onSelectKey={setColorKey}
            onChange={(v) => setTheme({ hotspotIconColor: v })}
          />

          {colorKey && (
            <div className="mt-2">
              <HexColorPicker
                color={theme[colorKey as keyof typeof theme] as string}
                onChange={(color) =>
                  setTheme({ [colorKey]: color } as Record<string, string>)
                }
              />
            </div>
          )}
        </div>

        {/* Hotspot Style */}
        <div className="px-3 py-3 border-b border-white/5 space-y-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Hotspot Settings
          </label>
          <div>
            <label className="text-[9px] text-slate-500">Label Style</label>
            <select
              value={theme.hotspotLabelStyle}
              onChange={(e) =>
                setTheme({
                  hotspotLabelStyle: e.target.value as 'tooltip' | 'always' | 'hover',
                })
              }
              className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
            >
              <option value="tooltip">Tooltip</option>
              <option value="always">Always Visible</option>
              <option value="hover">On Hover</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.hotspotPulseAnimation}
              onChange={(e) => setTheme({ hotspotPulseAnimation: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400">Pulse Animation</span>
          </label>
        </div>

        {/* Post-Processing */}
        <div className="px-3 py-3 border-b border-white/5 space-y-3">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Post-Processing
          </label>

          {/* Bloom */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pp.bloom || false}
                onChange={(e) => setTheme({ postProcessing: { ...pp, bloom: e.target.checked } })}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Sun size={12} className="text-amber-400" />
              <span className="text-[10px] text-slate-400">Bloom</span>
            </label>
            {pp.bloom && (
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Intensity</label>
                  <input
                    type="range" min={0} max={2} step={0.05}
                    value={pp.bloomIntensity ?? 0.4}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, bloomIntensity: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.bloomIntensity ?? 0.4).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Threshold</label>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={pp.bloomThreshold ?? 0.6}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, bloomThreshold: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.bloomThreshold ?? 0.6).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* SSAO */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pp.ssao || false}
                onChange={(e) => setTheme({ postProcessing: { ...pp, ssao: e.target.checked } })}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Eye size={12} className="text-blue-400" />
              <span className="text-[10px] text-slate-400">SSAO</span>
            </label>
            {pp.ssao && (
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Radius</label>
                  <input
                    type="range" min={0.01} max={0.5} step={0.01}
                    value={pp.ssaoRadius ?? 0.05}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, ssaoRadius: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.ssaoRadius ?? 0.05).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Intensity</label>
                  <input
                    type="range" min={1} max={50} step={1}
                    value={pp.ssaoIntensity ?? 15}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, ssaoIntensity: parseInt(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{pp.ssaoIntensity ?? 15}</span>
                </div>
              </div>
            )}
          </div>

          {/* Vignette */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pp.vignette || false}
                onChange={(e) => setTheme({ postProcessing: { ...pp, vignette: e.target.checked } })}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Aperture size={12} className="text-purple-400" />
              <span className="text-[10px] text-slate-400">Vignette</span>
            </label>
            {pp.vignette && (
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Offset</label>
                  <input
                    type="range" min={0} max={0.5} step={0.01}
                    value={pp.vignetteOffset ?? 0.1}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, vignetteOffset: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.vignetteOffset ?? 0.1).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Darkness</label>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={pp.vignetteDarkness ?? 0.8}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, vignetteDarkness: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.vignetteDarkness ?? 0.8).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tone Mapping */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Monitor size={12} className="text-emerald-400" />
              <span className="text-[10px] text-slate-400">Tone Mapping</span>
            </div>
            <div className="ml-6 space-y-1">
              <div>
                <select
                  value={pp.toneMapping ?? 'aces'}
                  onChange={(e) => setTheme({ postProcessing: { ...pp, toneMapping: e.target.value as 'aces' | 'reinhard' | 'cineon' | 'agx' | 'linear' } })}
                  className="w-full px-2 py-1 text-[10px] bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
                >
                  <option value="aces">ACES Filmic</option>
                  <option value="reinhard">Reinhard</option>
                  <option value="cineon">Cineon</option>
                  <option value="agx">AgX</option>
                  <option value="linear">Linear</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-slate-500 w-16 shrink-0">Exposure</label>
                <input
                  type="range" min={0.1} max={3} step={0.05}
                  value={pp.toneMappingExposure ?? 1.0}
                  onChange={(e) => setTheme({ postProcessing: { ...pp, toneMappingExposure: parseFloat(e.target.value) } })}
                  className="flex-1"
                />
                <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.toneMappingExposure ?? 1.0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Depth of Field */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pp.depthOfField || false}
                onChange={(e) => setTheme({ postProcessing: { ...pp, depthOfField: e.target.checked } })}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Focus size={12} className="text-cyan-400" />
              <span className="text-[10px] text-slate-400">Depth of Field</span>
            </label>
            {pp.depthOfField && (
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Focus Dist</label>
                  <input
                    type="range" min={0} max={0.1} step={0.001}
                    value={pp.dofFocusDistance ?? 0.01}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, dofFocusDistance: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.dofFocusDistance ?? 0.01).toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Focal Len</label>
                  <input
                    type="range" min={0} max={0.1} step={0.001}
                    value={pp.dofFocalLength ?? 0.02}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, dofFocalLength: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.dofFocalLength ?? 0.02).toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Bokeh</label>
                  <input
                    type="range" min={0} max={10} step={0.1}
                    value={pp.dofBokehScale ?? 2}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, dofBokehScale: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.dofBokehScale ?? 2).toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Chromatic Aberration */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pp.chromaticAberration || false}
                onChange={(e) => setTheme({ postProcessing: { ...pp, chromaticAberration: e.target.checked } })}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Zap size={12} className="text-pink-400" />
              <span className="text-[10px] text-slate-400">Chromatic Aberration</span>
            </label>
            {pp.chromaticAberration && (
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Offset</label>
                  <input
                    type="range" min={0} max={0.02} step={0.0005}
                    value={pp.caOffset ?? 0.002}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, caOffset: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.caOffset ?? 0.002).toFixed(4)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Color Grading */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pp.colorGrading || false}
                onChange={(e) => setTheme({ postProcessing: { ...pp, colorGrading: e.target.checked } })}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Palette size={12} className="text-amber-400" />
              <span className="text-[10px] text-slate-400">Color Grading</span>
            </label>
            {pp.colorGrading && (
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Brightness</label>
                  <input
                    type="range" min={-1} max={1} step={0.05}
                    value={pp.cgBrightness ?? 0}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, cgBrightness: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.cgBrightness ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Contrast</label>
                  <input
                    type="range" min={-1} max={1} step={0.05}
                    value={pp.cgContrast ?? 0}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, cgContrast: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.cgContrast ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Saturation</label>
                  <input
                    type="range" min={-1} max={1} step={0.05}
                    value={pp.cgSaturation ?? 0}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, cgSaturation: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.cgSaturation ?? 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Screen Space Reflections */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pp.screenSpaceReflections || false}
                onChange={(e) => setTheme({ postProcessing: { ...pp, screenSpaceReflections: e.target.checked } })}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <Eye size={12} className="text-sky-400" />
              <span className="text-[10px] text-slate-400">SSR (Experimental)</span>
            </label>
            {pp.screenSpaceReflections && (
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-slate-500 w-16 shrink-0">Intensity</label>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={pp.ssrIntensity ?? 0.5}
                    onChange={(e) => setTheme({ postProcessing: { ...pp, ssrIntensity: parseFloat(e.target.value) } })}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-slate-500 w-8 text-right">{(pp.ssrIntensity ?? 0.5).toFixed(2)}</span>
                </div>
                <p className="text-[8px] text-slate-600 ml-0">SSR may impact performance significantly</p>
              </div>
            )}
          </div>
        </div>

        {/* Path Tracer */}
        <PathTracerSection />

        {/* Light Editor */}
        <LightEditorSection />

        {/* Environment */}
        <div className="px-3 py-3 space-y-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Environment
          </label>
          <div>
            <label className="text-[9px] text-slate-500">Type</label>
            <select
              value={environment.type}
              onChange={(e) =>
                setEnvironment({ type: e.target.value as 'hdri' | 'color' | 'panorama' })
              }
              className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
            >
              <option value="hdri">HDRI</option>
              <option value="color">Solid Color</option>
              <option value="panorama">360° Panorama</option>
            </select>
          </div>

          {environment.type === 'hdri' && (
            <div>
              <label className="text-[9px] text-slate-500">Preset</label>
              <select
                value={environment.preset || 'studio'}
                onChange={(e) => setEnvironment({ preset: e.target.value })}
                className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:outline-none"
              >
                <option value="studio">Studio</option>
                <option value="sunset">Sunset</option>
                <option value="dawn">Dawn</option>
                <option value="night">Night</option>
                <option value="warehouse">Warehouse</option>
                <option value="forest">Forest</option>
                <option value="apartment">Apartment</option>
                <option value="park">Park</option>
                <option value="city">City</option>
              </select>
            </div>
          )}

          {environment.type === 'color' && (
            <div>
              <label className="text-[9px] text-slate-500">Background Color</label>
              <input
                type="color"
                value={environment.color || '#0f172a'}
                onChange={(e) => setEnvironment({ color: e.target.value })}
                className="w-full h-8 mt-0.5 rounded border border-white/10 cursor-pointer"
              />
            </div>
          )}

          {environment.type === 'panorama' && (
            <div>
              <label className="text-[9px] text-slate-500">Panorama Image URL</label>
              <input
                type="text"
                value={environment.url || ''}
                onChange={(e) => setEnvironment({ url: e.target.value })}
                placeholder="https://example.com/panorama.jpg"
                className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-800 border border-white/10 rounded text-slate-300 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[8px] text-slate-600 mt-1">Equirectangular image URL for 360° background</p>
            </div>
          )}

          <div>
            <label className="text-[9px] text-slate-500">Intensity</label>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={environment.intensity}
              onChange={(e) => setEnvironment({ intensity: parseFloat(e.target.value) })}
              className="w-full mt-0.5"
            />
            <span className="text-[9px] text-slate-500">{environment.intensity.toFixed(1)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-3 py-3 border-t border-white/5 space-y-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Controls
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.showOrbitControls}
              onChange={(e) => setTheme({ showOrbitControls: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            <span className="text-[10px] text-slate-400">Orbit Controls</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.showZoomButtons}
              onChange={(e) => setTheme({ showZoomButtons: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            <span className="text-[10px] text-slate-400">Zoom Buttons</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.showFullscreenButton}
              onChange={(e) => setTheme({ showFullscreenButton: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            <span className="text-[10px] text-slate-400">Fullscreen Button</span>
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── Path Tracer Section ──────────────────────────────────

function PathTracerSection() {
  const { pathTracerEnabled, pathTracerSamples, pathTracerMaxSamples, setPathTracerEnabled, setPathTracerMaxSamples } = useExperienceStore()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="px-3 py-3 border-b border-white/5">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          <Zap size={10} className="text-emerald-400" />
          Path Tracer
        </button>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={pathTracerEnabled}
            onChange={(e) => setPathTracerEnabled(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
          />
        </label>
      </div>

      {expanded && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-slate-500 w-16 shrink-0">Max Samples</label>
            <input
              type="range" min={32} max={2048} step={32}
              value={pathTracerMaxSamples}
              onChange={(e) => setPathTracerMaxSamples(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-[9px] text-slate-500 w-12 text-right">{pathTracerMaxSamples}</span>
          </div>
          {pathTracerEnabled && (
            <div className="text-[8px] text-emerald-500/70 bg-emerald-500/5 rounded px-2 py-1.5 border border-emerald-500/10">
              <div className="flex items-center justify-between mb-1">
                <span>Progressive rendering active</span>
                <span className="text-emerald-400">{pathTracerSamples}/{pathTracerMaxSamples} samples</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (pathTracerSamples / pathTracerMaxSamples) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {!pathTracerEnabled && (
            <p className="text-[8px] text-slate-600">
              Enables progressive sample accumulation for higher quality rendering. Best used with ACES tone mapping.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Light Editor Section ──────────────────────────────────

function LightEditorSection() {
  const { lights, addLight, updateLight, removeLight } = useExperienceStore()
  const [expanded, setExpanded] = useState(lights.length > 0)

  const handleAddLight = () => {
    const id = `light_${Date.now()}`
    addLight({
      id,
      name: `Light ${lights.length + 1}`,
      type: 'point',
      color: '#ffffff',
      intensity: 1.0,
      position: [2, 3, 2],
      castShadow: false,
    })
  }

  return (
    <div className="px-3 py-3 border-b border-white/5">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold"
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Lights
        </button>
        <button
          onClick={handleAddLight}
          className="flex items-center gap-0.5 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus size={10} /> Add
        </button>
      </div>

      {expanded && (
        <div className="space-y-2">
          {lights.map((light) => (
            <LightItem key={light.id} light={light} />
          ))}
        </div>
      )}
    </div>
  )
}

function LightItem({ light }: { light: LightConfig }) {
  const { updateLight, removeLight } = useExperienceStore()
  const [isOpen, setIsOpen] = useState(false)

  const typeIcons: Record<string, React.ReactNode> = {
    ambient: <CircleDot size={12} className="text-slate-300" />,
    directional: <Sun size={12} className="text-yellow-400" />,
    point: <Lightbulb size={12} className="text-blue-400" />,
    spot: <Aperture size={12} className="text-purple-400" />,
    hemisphere: <Eye size={12} className="text-green-400" />,
  }

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
      >
        {typeIcons[light.type] || <Lightbulb size={12} />}
        <span className="text-[10px] font-medium text-slate-300 flex-1 truncate">
          {light.name}
        </span>
        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: light.color }} />
        <span className="text-[9px] text-slate-500">{light.type}</span>
        <button
          onClick={(e) => { e.stopPropagation(); removeLight(light.id) }}
          className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
        >
          <Trash2 size={10} />
        </button>
        <ChevronDown
          size={10}
          className={`text-slate-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
      </div>

      {isOpen && (
        <div className="px-2 py-2 space-y-1.5 border-t border-white/5 bg-slate-900/50">
          <div>
            <label className="text-[9px] text-slate-500">Name</label>
            <input
              type="text"
              value={light.name}
              onChange={(e) => updateLight(light.id, { name: e.target.value })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500">Type</label>
            <select
              value={light.type}
              onChange={(e) => updateLight(light.id, { type: e.target.value as LightConfig['type'] })}
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
            >
              <option value="ambient">Ambient</option>
              <option value="directional">Directional</option>
              <option value="point">Point</option>
              <option value="spot">Spot</option>
              <option value="hemisphere">Hemisphere</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[9px] text-slate-500">Color</label>
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="color"
                  value={light.color}
                  onChange={(e) => updateLight(light.id, { color: e.target.value })}
                  className="w-6 h-6 rounded border border-white/10 cursor-pointer"
                />
                <input
                  type="text"
                  value={light.color}
                  onChange={(e) => updateLight(light.id, { color: e.target.value })}
                  className="flex-1 px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="w-20">
              <label className="text-[9px] text-slate-500">Intensity</label>
              <input
                type="number"
                step={0.1}
                value={light.intensity}
                onChange={(e) => updateLight(light.id, { intensity: parseFloat(e.target.value) || 0 })}
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
              />
            </div>
          </div>
          {light.type !== 'ambient' && (
            <div>
              <label className="text-[9px] text-slate-500">Position (X, Y, Z)</label>
              <div className="grid grid-cols-3 gap-1 mt-0.5">
                {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                  <input
                    key={axis}
                    type="number"
                    step={0.5}
                    value={light.position[i]}
                    onChange={(e) => {
                      const newPos: [number, number, number] = [...light.position]
                      newPos[i] = parseFloat(e.target.value) || 0
                      updateLight(light.id, { position: newPos })
                    }}
                    className="px-1 py-0.5 text-[10px] bg-slate-700/50 border border-white/5 rounded text-slate-400 focus:outline-none"
                    placeholder={axis}
                  />
                ))}
              </div>
            </div>
          )}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={light.castShadow}
              onChange={(e) => updateLight(light.id, { castShadow: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            <span className="text-[9px] text-slate-400">Cast Shadow</span>
          </label>
          {light.type === 'spot' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-slate-500 w-12 shrink-0">Angle</label>
                <input
                  type="range" min={0.1} max={Math.PI / 2} step={0.05}
                  value={light.angle || 0.5}
                  onChange={(e) => updateLight(light.id, { angle: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-[9px] text-slate-500">{(light.angle || 0.5).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-slate-500 w-12 shrink-0">Penumbra</label>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={light.penumbra || 0}
                  onChange={(e) => updateLight(light.id, { penumbra: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-[9px] text-slate-500">{(light.penumbra || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Color Field Helper ────────────────────────────────────

function ColorField({
  label,
  value,
  colorKey,
  activeKey,
  onSelectKey,
  onChange,
}: {
  label: string
  value: string
  colorKey: string
  activeKey: string | null
  onSelectKey: (key: string | null) => void
  onChange: (value: string) => void
}) {
  const isActive = activeKey === colorKey

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 rounded border cursor-pointer transition-all ${
          isActive ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-white/20'
        }`}
        style={{ backgroundColor: value }}
        onClick={() => onSelectKey(isActive ? null : colorKey)}
      />
      <div className="flex-1">
        <div className="text-[9px] text-slate-500">{label}</div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-[10px] text-slate-400 bg-transparent focus:outline-none"
        />
      </div>
    </div>
  )
}
