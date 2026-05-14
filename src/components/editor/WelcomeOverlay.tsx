'use client'

import React, { useState } from 'react'
import { useExperienceStore } from '@/store/experience-store'
import {
  Sparkles,
  Upload,
  MapPin,
  Zap,
  Palette,
  Play,
  ChevronRight,
  Box,
  Monitor,
  Crosshair,
  MousePointer,
  Settings,
  Keyboard,
} from 'lucide-react'

const steps = [
  {
    icon: <Upload size={24} />,
    title: 'Import Your 3D Model',
    description: 'Drag & drop GLTF/GLB files or import from URL. Use the built-in demo scene to get started instantly.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: <MapPin size={24} />,
    title: 'Place Hotspots',
    description: 'Add 2D or 3D hotspots to mark interactive points. Click "Add Hotspot" then click on the scene, or add manually.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: <Zap size={24} />,
    title: 'Define Behaviors',
    description: 'Create rich interactions with 8 action types: camera moves, material changes, animations, UI panels, and more.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: <Palette size={24} />,
    title: 'Customize Theme',
    description: 'Choose from 4 skin presets or create your own look with custom colors, environment, and hotspot styles.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: <Play size={24} />,
    title: 'Preview & Export',
    description: 'Test your experience in preview mode, then export as JSON config, iframe embed, or React component.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
]

export function WelcomeOverlay() {
  const { hasSeenWelcome, setHasSeenWelcome } = useExperienceStore()
  const [currentStep, setCurrentStep] = useState(0)

  if (hasSeenWelcome) return null

  const handleDismiss = () => {
    setHasSeenWelcome(true)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleDismiss()
    }
  }

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            3D Experience Builder
          </h1>
          <p className="text-sm text-slate-400">
            Transform 3D models into interactive experiences — no code required
          </p>
        </div>

        {/* Step card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center shrink-0 ${step.color}`}>
              {step.icon}
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Step {currentStep + 1} of {steps.length}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-emerald-500' : 'w-1.5 bg-white/20 hover:bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Keyboard shortcuts preview */}
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Keyboard size={14} className="text-slate-500" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Quick Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-white/10">P</kbd>
              <span className="text-slate-500">Preview mode</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-white/10">H</kbd>
              <span className="text-slate-500">Add hotspot</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-white/10">G</kbd>
              <span className="text-slate-500">Toggle grid</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-white/10">M</kbd>
              <span className="text-slate-500">Measure</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-white/10">⌘Z</kbd>
              <span className="text-slate-500">Undo</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-white/10">B</kbd>
              <span className="text-slate-500">Bookmark</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Skip intro
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next <ChevronRight size={12} />
                </>
              ) : (
                <>
                  <Sparkles size={12} /> Get Started
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
